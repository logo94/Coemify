import { apiRequest } from "./api.js";
import { showAlert } from "./utils.js";

// Format seconds to MM:SS
function formatDuration(seconds) {
    if (!seconds) return "";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Track batch mode state
let batchMode = false;
let batchTracks = [];

export function setBatchMode(mode) {
    batchMode = mode;
}

export function getBatchTracks() {
    return batchTracks;
}


// Batch upload functions for multi-file album upload

export async function firstUpload(files) {
    
    if (!files || files.length === 0) {
        showAlert("Nessun file selezionato", 'warning');
        return;
    }

    const formData = new FormData();
    for (const file of files) {
        formData.append("files", file);
    }

    const spinner = document.getElementById("uploadSpinner");
    spinner.style.display = "inline-block";

    try {
        const data = await apiRequest("/api/upload-temp", {
            method: "POST",
            body: formData
        });

        if (!data) {
            showAlert("Nessuna risposta dal server", 'danger');
            return;
        } 

        spinner.style.display = "none";

        if (data.errors && data.errors.length > 0) {
            data.errors.forEach(err => showAlert("Errore: " + err, 'danger'));
            return;
        }

        // Set batch mode
        batchTracks = data.tracks;

        // Show dashboard
        document.getElementById("uploadSection").style.display = "none";
        document.getElementById("dashboardContent").style.display = "flex";

        // Populate shared metadata from first file
        const shared = data.album;
        document.getElementById("artist").value = shared.artist || "";
        document.getElementById("album").value = shared.album || "";
        document.getElementById("genre").value = shared.genre || "";
        document.getElementById("release_date").value = shared.release_date || "";

        if (shared.cover) {
            document.getElementById("coverImg").src = shared.cover;
        }

        // Show and populate track list
        const trackListSection = document.getElementById("trackListSection");
        const trackList = document.getElementById("trackList");
        trackListSection.style.display = "block";
        trackList.innerHTML = "";

        data.tracks.forEach((track, index) => {
            const trackBox = document.createElement("div");
            trackBox.className = "card track-card m-2 p-2 rounded";
            const trackItem = document.createElement("div");
            trackItem.className = "track-item p-1 rounded";
            const formattedDuration = formatDuration(track.duration);
            // Use original track number from metadata, or fallback to index + 1
            const trackNumber = track.track_number || (index + 1);
            trackItem.innerHTML = `
                <div class="d-flex align-items-center">
                    <input type="number"
                        class="form-control form-control-sm border-0 border-bottom track-number me-2"
                        style="width: 30px;"
                        value="${trackNumber}"
                        min="1">

                    <div class="position-relative w-100">
                        <input type="text"
                            class="form-control form-control-sm border-0 border-bottom w-100 title track-title"
                            data-index="${index}"
                            data-tempfile="${track.temp_file}"
                            value="${track.title || track.original_filename.replace(/\.[^/.]+$/, "")}"
                            placeholder="Titolo traccia">

                        <span class="duplicate-badge">Duplicato</span>
                    </div>

                    <span class="ms-2 duration small">${formattedDuration}</span>
                </div>
            `;

            trackBox.appendChild(trackItem);
            trackList.appendChild(trackBox);
        });

    } catch (error) {
        console.error("Errore durante l'upload batch:", error);
        showAlert("Errore durante l'upload: " + error, 'danger');
    } finally {
        spinner.style.display = "none";
    }
}

export async function finalUpload() {

    // Check if cover is set
    const coverImg = document.getElementById("coverImg");
    const coverFile = document.getElementById("coverFile").files[0];
    const hasValidCover = coverFile || (coverImg.src && !coverImg.src.includes("/static/img/default.png"));

    if (!hasValidCover) {
        showAlert("Copertina obbligatoria", 'warning');
        return; 
    }

    // Disable buttons and show loading
    const saveBtn = document.getElementById("finalUpload");
    const searchBtn = document.getElementById("search-meta");
    saveBtn.disabled = true;
    searchBtn.disabled = true;
    saveBtn.textContent = "Caricamento...";

    // Gather shared metadata
    const artist = document.getElementById("artist").value;
    const album = document.getElementById("album").value;
    const genre = document.getElementById("genre").value;
    const release_date = document.getElementById("release_date").value;

    // Gather track data from inputs
    const tracksData = [];

    const trackCards = document.querySelectorAll(".track-card");
    trackCards.forEach(card => {
        const trackNumber = card.querySelector(".track-number").value;
        const titleInput = card.querySelector(".title").value;
        const tempFile = card.querySelector(".track-title").dataset.tempfile;
        const duration = card.querySelector(".duration").textContent;
        tracksData.push({
            temp_file: tempFile,
            title: titleInput,
            duration: duration,
            track_number: parseInt(trackNumber, 10)
        });
    });

    const formData = new FormData();
    formData.append("artist", artist);
    formData.append("album", album);
    formData.append("genre", genre);
    formData.append("release_date", release_date);
    formData.append("tracks", JSON.stringify(tracksData));

    // Add cover if changed
    if (coverFile) {
        formData.append("cover", coverFile);
    }

    document.getElementById("uploadSpinner").style.display = "inline-block";

    try {
        const data = await apiRequest("/api/upload-final", {
            method: "POST",
            body: formData
        });

        if (data.errors && data.errors.length > 0) {
            errors.forEach(err => showAlert("Errore: " + err, 'danger'));
        } else {
            showAlert(data.message || "Album caricato con successo!", 'success');
        }

        setTimeout(() => {
            location.reload();
        }, 3000);

    } catch (error) {
        console.error("Errore durante l'upload batch:", error);
        showAlert("Errore durante l'upload: " + error, 'danger');
    } finally {
        document.getElementById("uploadSpinner").style.display = "none";
        // Re-enable buttons
        const saveBtn = document.getElementById("finalUpload");
        const searchBtn = document.getElementById("search-meta");
        saveBtn.disabled = false;
        searchBtn.disabled = false;
        saveBtn.textContent = "Salva in Navidrome";
    }
}
