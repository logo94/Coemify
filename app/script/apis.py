import requests

from app.script.settings import settings

# ------------------------
# Navidrome API
# ------------------------
def check_navidrome(metadata: dict):
    query = f"{metadata.get('artist','')} {metadata.get('title','')}"
    try:
        r = requests.get(
            f"{settings.NAVIDROME_URL}/rest/search3",
            params={
                "u": settings.NAVIDROME_USER,
                "p": settings.NAVIDROME_PASS,
                "v": "1.16.1",
                "c": "dup-check",
                "f": "json",
                "query": query
            },
            timeout=5
        )
        r.raise_for_status()
        response_json = r.json()
        
        print(response_json)
        
        search_result = (
            response_json
            .get("subsonic-response", {})
            .get("searchResult3", {})
        )
        
        albums = search_result.get("album", [])

        album_meta = {}

        for a in albums:
            album_meta[a["id"]] = {
                "genre": (
                    a.get("genre")
                    or (a.get("genres", [{}])[0].get("name"))
                ),
                "coverArt": a.get("coverArt")
            }
                                
        songs = search_result.get("song", [])
        
        duplicates = []

        for s in songs:
            album_id = s.get("albumId")
            album_info = album_meta.get(album_id, {})
           
            duplicates.append({
                "title": s.get("title"),
                "artist": s.get("artist"),
                "album": s.get("album"),
                "year": s.get("year"),
                "genre": album_info.get("genre"),
                "cover": album_info.get("coverArt")
            })
        return duplicates
    except Exception:
        return []
    
def get_navidrome_image(cover_id: str, size: int = 250) -> bytes:
    try:
        r = requests.get(
            f"{settings.NAVIDROME_URL}/rest/getCoverArt",
            params={
                "u": settings.NAVIDROME_USER,
                "p": settings.NAVIDROME_PASS,
                "v": "1.16.1",
                "c": "cover-proxy",
                "id": cover_id,
                "size": size
            },
            timeout=5
        )
        r.raise_for_status()
        return r
    except Exception:
        return b""
    
def get_artists_albums_genres():
    try:
        # Chiamata API per ottenere tutti gli artisti, album e generi
        response = requests.get(
            f"{settings.NAVIDROME_URL}/rest/search3",
            params={
                "u": settings.NAVIDROME_USER,
                "p": settings.NAVIDROME_PASS,
                "v": "1.16.1",
                "c": "autocomplete",
                "f": "json",
                "query": "",  # Query vuota per ottenere tutte le informazioni
            },
            timeout=5
        )
        response.raise_for_status()
        data = response.json()
        
        print(data)
        
        # Estrai lista di artisti, album e generi
        artists = set()
        albums = set()
        genres = set()

        if "subsonic-response" in data and "searchResult3" in data["subsonic-response"]:
            for song in data["subsonic-response"]["searchResult3"]["song"]:
                artist = song.get("artist")
                album = song.get("album")
                genre = song.get("genre")
                
                if artist:
                    artists.add(artist)
                if album:
                    albums.add(album)
                if genre:
                    genres.add(genre)
        
        return sorted(list(artists)), sorted(list(albums)), sorted(list(genres))
    
    except Exception as e:
        print(f"Errore nel recuperare artisti, album e generi: {e}")
        return [], [], []
