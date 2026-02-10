# Default
from typing import Literal

# FastAPI
from fastapi import HTTPException

# Requirements
import requests

# .env
from app.script.settings import settings

# ------------------------
# Navidrome API
# ------------------------

# Helper
API_PARAMS = {
    "u": settings.NAVIDROME_USER,
    "p": settings.NAVIDROME_PASS,
    "v": "1.16.1",
    "c": "autocomplete",
    "f": "json",
}

def navidrome_request(scope: str, params: dict) -> dict:
    try:
        r = requests.get(
            f"{settings.NAVIDROME_URL}/rest/{scope}",
            params=params,
            timeout=5
        )
        r.raise_for_status()
    except requests.RequestException as e:
        raise HTTPException(status_code=502, detail=f"Navidrome non raggiungibile: {e}")

    try:
        data = r.json()
    except ValueError:
        raise HTTPException(status_code=502, detail="Risposta Navidrome non valida")

    if "subsonic-response" in data and data["subsonic-response"].get("status") == "failed":
        msg = data["subsonic-response"].get("error", {}).get("message", "unknown")
        raise HTTPException(status_code=404, detail=f"Navidrome error: {msg}")

    return data

### TENDINE
def get_navidrome_artist():
    params = API_PARAMS.copy()
    params['type'] = "alphabeticalByName"
    params['size'] = "500"
    data = navidrome_request(scope="getArtists", params=params)

    index = data.get('subsonic-response', {}).get('artists', {}).get('index', [])

    artist_list = []
    for group in index:
        for artist in group.get('artist', []):
            artist_list.append({
                'id': artist['id'],
                'name': artist['name']
            })

    return artist_list


def get_navidrome_albums():
    params = API_PARAMS.copy()
    params['type'] = "alphabeticalByName"
    params['size'] = "500"
    data = navidrome_request(scope="getAlbumList2", params=params)
    album_list = data.get('subsonic-response', {}).get('albumList2', {}).get('album', [])
    return [album['name'] for album in album_list]

def get_navidrome_genres():
    params = API_PARAMS.copy()
    data = navidrome_request(scope="getGenres", params=params)
    genre_list = data.get('subsonic-response', {}).get('genres', {}).get('genre', [])
    return [genre['value'] for genre in genre_list]


### DUPLICATI
def check_duplicates_navidrome(metadata: dict):
    query = f"{metadata.get('artist','')} {metadata.get('title','')}"
    params = API_PARAMS.copy()
    params.update({
        "c": "dup-check",
        "query": query,
    })
    data = navidrome_request(scope="search3", params=params)

    search_result = data.get("subsonic-response", {}).get("searchResult3", {})

    albums_by_id = {
        a["id"]: a for a in search_result.get("album", [])
    }

    duplicates = []

    for s in search_result.get("song", []):
        album = albums_by_id.get(s.get("albumId"), {})

        duplicates.append({
            "title": s.get("title"),
            "artist": s.get("artist"),
            "album": s.get("album"),
            "year": s.get("year"),
            "genre": (
                album.get("genre")
                or (album.get("genres", [{}])[0].get("name"))
            ),
        })

    return duplicates

### INFORMAZIONI ALBUM
def get_albums_by_artist(artist_id: str):
    params = API_PARAMS.copy()
    params.update({
        "id": artist_id
    })
    data = navidrome_request(scope="getArtist", params=params)

    albums = data.get("subsonic-response", {}).get("artist", {}).get("album", [])

    return [
        {
            "id": a["id"],
            "name": a["name"],
            "year": a.get("year"),
            "genre": a.get("genre"),
            "cover": a.get("coverArt"),
        }
        for a in albums
    ]

def get_navidrome_image(cover_id: str, size: int = 250):
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
