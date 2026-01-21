import { showAlert, normalizeValue } from "./utils.js";

export async function apiRequest(url, params, raw_response=false) {

    const response = await fetch(url, params);

    if (!response.ok) {
        const error = await response.json();
        showAlert(`Errore: ${error.detail || "unknown"}`, 'danger');
        return;
    }

    if (raw_response) return response

    const data = await response.json();

    return data

}

async function loadArtists() {
    const artists = await apiRequest('/api/artists')
    const artistList = document.getElementById("artists");
    artistList.innerHTML = "";
    artists.forEach(artist => {
        const option = document.createElement("option");
        option.value = artist.name;
        option.dataset.id = artist.id
        artistList.appendChild(option);
    });
}

async function loadAlbums() {
    const albums = await apiRequest('/api/albums')
    const albumList = document.getElementById("albums");
    albumList.innerHTML = "";
    albums.forEach(album => {
        const val = normalizeValue(album);
        if (!val) return;
        const option = document.createElement("option");
        option.value = val;
        albumList.appendChild(option);
    });
}

async function loadGenres() {
    const genres = await apiRequest('/api/genres')
    const genreList = document.getElementById("genres");
    genreList.innerHTML = "";
    genres.forEach(genre => {
        const val = normalizeValue(genre);
        if (!val) return;
        const option = document.createElement("option");
        option.value = val;
        genreList.appendChild(option);
    });
}

export async function loadOptions() {
    await loadArtists();
    await loadAlbums();
    await loadGenres()
}

export async function checkDuplicates() {

    const list = document.getElementById("duplicatesList");
    list.innerHTML = "";

    const title = document.getElementById("title").value;
    const artist = document.getElementById("artist").value;
    
    const duplicates = await apiRequest(`/api/search-duplicates?title=${title}&artist=${artist}`)
    
    if (duplicates.length < 1) {
        const noDuplicates = document.createElement("li");
        noDuplicates.className = "list-group-item text-center bg-transparent border-0";
        noDuplicates.textContent = "Nessun duplicato trovato.";
        list.appendChild(noDuplicates);
    
    } else {
        
        document.getElementById("dup-badge").textContent = duplicates.length

        duplicates.forEach(d => {
            const li = document.createElement("li");
            li.className = "list-group-item bg-transparent border-0 border-bottom d-flex align-items-center";

            const info = document.createElement("div");
            info.className = "same-artist-info";
            info.innerHTML = `<strong>${d.title}</strong><br>${d.artist} - ${d.album} (${d.year || "?"})`;

            li.appendChild(info);
            list.appendChild(li);
        });
    }

}

function navidromeCoverUrl(coverId, size = 150) {
    if (!coverId) return "/static/img/default.png";
    return `/api/albums/cover/${coverId}?size=${size}`;
}

export async function loadArtistAlbums() {
    
    const sameArtistList = document.getElementById("sameArtistList");
    sameArtistList.innerHTML = "";

    const input = document.getElementById("artist");
    const list = document.getElementById("artists");

    const option = [...list.options]
        .find(o => o.value === input.value);

    if (option?.dataset.id) {

        const artistId = option.dataset.id
        const albums = await apiRequest(`/api/albums/artist/${encodeURIComponent(artistId)}`)

            if (albums.length < 1 ) {
                const noDuplicates = document.createElement("li");
                noDuplicates.className = "list-group-item text-center bg-transparent border-0";
                noDuplicates.textContent = "Nessun album trovato.";
                sameArtistList.appendChild(noDuplicates);
            } else {

                document.getElementById("album-badge").textContent = albums.length

                albums.forEach(d => {
                    const li = document.createElement("li");
                    li.className = "list-group-item bg-transparent border-0 border-bottom d-flex align-items-center";

                    const img = document.createElement("img");
                    img.src = navidromeCoverUrl(d.cover);
                    img.className = "cover-thumb me-3";
                    img.style.cursor = "pointer";

                    // click sulla cover -> auto-riempie il form
                    img.addEventListener("click", () => {
                        document.getElementById("album").value = d.name || "";
                        document.getElementById("genre").value = d.genre || "";
                        document.getElementById("release_date").value = d.year || "";

                        // se vuoi anche aggiornare l'anteprima cover
                        document.getElementById("coverImg").src = img.src;
                    });

                    // 2) info testo
                    const info = document.createElement("div");
                    info.innerHTML = `
                        <strong>${d.name}</strong><br>
                        ${d.year || "?"} | ${d.genre || "-"}
                    `;

                    li.appendChild(img);
                    li.appendChild(info);
                    sameArtistList.appendChild(li);

                });

            }
    } else {

        const noDuplicates = document.createElement("li");
        noDuplicates.className = "list-group-item text-center bg-transparent border-0";
        noDuplicates.textContent = "Nessun album trovato.";
        sameArtistList.appendChild(noDuplicates);


    }



    
    
}

