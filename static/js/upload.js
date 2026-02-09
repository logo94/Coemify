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

export function isBatchMode() {
    return batchMode;
}

export function setBatchMode(mode) {
    batchMode = mode;
}

export function getBatchTracks() {
    return batchTracks;
}

export async function firstUpload() {

    const fileInput = document.getElementById("audioFile");
    if (!fileInput.files.length) return alert("Seleziona un file!");

    const formData = new FormData();
    formData.append("file", fileInput.files[0]);

    const spinner = document.getElementById("uploadSpinner");
    spinner.style.display = "inline-block";

    try {
        const data = await apiRequest("/api/upload-temp", {
            method: "POST",
            body: formData
        });

        if (!data) return;

        // Mostra la dashboard
        document.getElementById("uploadSection").style.display = "none";
        document.getElementById("dashboardContent").style.display = "flex";

        // Popola i metadati
        const md = data.metadata;
        document.getElementById("title").value = md.title || "";
        document.getElementById("artist").value = md.artist || "";
        document.getElementById("album").value = md.album || "";
        document.getElementById("genre").value = md.genre || "";
        document.getElementById("duration").value = md.duration || "";
        document.getElementById("release_date").value = md.release_date || "";

        if (md.track_number !== undefined && md.track_number !== null) {
            document.getElementById("track_number").value = md.track_number;
        }

        if (md.cover) {
            document.getElementById("coverImg").src = md.cover;
        }

        // Salva il path temporaneo
        document.getElementById("tempFile").value = data.temp_file;

    } catch (error) {
        console.error("Errore durante l'upload:", error);
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
        return showAlert("Copertina obbligatoria", 'warning');
    }

    // Disable buttons and show loading
    const saveBtn = document.getElementById("finalUpload");
    const searchBtn = document.getElementById("search-meta");
    saveBtn.disabled = true;
    searchBtn.disabled = true;
    saveBtn.textContent = "Caricamento...";

    const formData = new FormData();

    // Aggiungi i dati dal form
    formData.append("temp_file", document.getElementById("tempFile").value); // File temporaneo
    formData.append("title", document.getElementById("title").value);  // Titolo
    formData.append("artist", document.getElementById("artist").value);  // Artista
    formData.append("album", document.getElementById("album").value);  // Album
    formData.append("genre", document.getElementById("genre").value);  // Genere
    formData.append("duration", document.getElementById("duration").value);  // Durata
    formData.append("release_date", document.getElementById("release_date").value);  // Anno
    
    formData.append("track_number", document.getElementById("track_number").value || "");

    // Aggiungi il file di copertura se presente
    if (coverFile) {
        formData.append("cover", coverFile);
    }

    document.getElementById("uploadSpinner").style.display = "inline-block";

    try {

        const data = await apiRequest("/api/upload-final", {
            method: "POST",
            body: formData
        });

        showAlert(data.detail || "File caricato con successo!", 'success');
                
        
        setTimeout(() => {
            location.reload();
        }, 3000);

    } catch (error) {
        console.error("Errore durante l'upload:", error);
        showAlert("Errore durante l'upload:" + error, 'danger');
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

// Batch upload functions for multi-file album upload

export async function batchFirstUpload(files) {
    if (!files || files.length === 0) return;

    const spinner = document.getElementById("uploadSpinner");
    const fileInfo = document.getElementById("fileInfo");
    spinner.style.display = "inline-block";

    try {
        // Upload files in parallel (max 5 concurrent) to avoid 413 payload limit
        const CONCURRENCY = 5;
        const fileArray = Array.from(files);
        const total = fileArray.length;
        const results = [];
        let completed = 0;

        fileInfo.value = `Analisi file 0/${total}...`;

        for (let start = 0; start < fileArray.length; start += CONCURRENCY) {
            const batch = fileArray.slice(start, start + CONCURRENCY);
            const batchResults = await Promise.all(
                batch.map((file, j) => {
                    const i = start + j;
                    const formData = new FormData();
                    formData.append("file", file);
                    return apiRequest("/api/upload-temp", {
                        method: "POST",
                        body: formData
                    }).then(data => {
                        completed++;
                        fileInfo.value = `Analisi file ${completed}/${total}...`;
                        return data ? { index: i, data, file } : null;
                    }).catch(() => {
                        completed++;
                        fileInfo.value = `Analisi file ${completed}/${total}...`;
                        return null;
                    });
                })
            );
            results.push(...batchResults.filter(Boolean));
        }
        if (results.length === 0) return;

        // Sort by original index to preserve file order
        results.sort((a, b) => a.index - b.index);

        const firstMd = results[0].data.metadata;
        const shared = {
            artist: firstMd.artist || "",
            album: firstMd.album || "",
            genre: firstMd.genre || "",
            release_date: firstMd.release_date || "",
            cover: firstMd.cover || null
        };

        const tracks = results.map(r => ({
            temp_file: r.data.temp_file,
            title: r.data.metadata.title || r.file.name.replace(".mp3", ""),
            duration: r.data.metadata.duration || "",
            track_number: r.data.metadata.track_number,
            original_filename: r.file.name
        }));

        // Set batch mode
        batchMode = true;
        batchTracks = tracks;

        // Show dashboard
        document.getElementById("uploadSection").style.display = "none";
        document.getElementById("dashboardContent").style.display = "flex";

        // Populate shared metadata from first file
        document.getElementById("artist").value = shared.artist || "";
        document.getElementById("album").value = shared.album || "";
        document.getElementById("genre").value = shared.genre || "";
        document.getElementById("release_date").value = shared.release_date || "";

        // Hide single-file fields (not used in batch mode)
        document.getElementById("title").closest(".mb-3").style.display = "none";
        document.getElementById("duration").closest(".mb-3").style.display = "none";
        document.getElementById("track_number").closest(".mb-3").style.display = "none";

        if (shared.cover) {
            document.getElementById("coverImg").src = shared.cover;
        }

        // Show and populate track list
        const trackListSection = document.getElementById("trackListSection");
        const trackList = document.getElementById("trackList");
        trackListSection.style.display = "block";
        trackList.innerHTML = "";

        tracks.forEach((track, index) => {
            const trackItem = document.createElement("div");
            trackItem.className = "track-item mb-2 p-2 bg-dark rounded";
            const formattedDuration = formatDuration(track.duration);
            // Use original track number from metadata, or fallback to index + 1
            const trackNumber = track.track_number || (index + 1);
            trackItem.innerHTML = `
                <div class="d-flex align-items-center">
                    <input type="number"
                           class="form-control form-control-sm track-number me-2"
                           data-index="${index}"
                           value="${trackNumber}"
                           min="1"
                           style="width: 50px; text-align: center;">
                    <input type="text"
                           class="form-control form-control-sm track-title"
                           data-index="${index}"
                           value="${track.title || ''}"
                           placeholder="Titolo traccia">
                    <span class="text-white ms-2 small" style="min-width: 45px;">${formattedDuration}</span>
                </div>
            `;
            trackList.appendChild(trackItem);
        });

        // Update file info
        fileInfo.value = `${tracks.length} file selezionati`;

    } catch (error) {
        console.error("Errore durante l'upload batch:", error);
        showAlert("Errore durante l'upload: " + error, 'danger');
    } finally {
        spinner.style.display = "none";
    }
}

export async function batchFinalUpload() {

    // Check if cover is set
    const coverImg = document.getElementById("coverImg");
    const coverFile = document.getElementById("coverFile").files[0];
    const hasValidCover = coverFile || (coverImg.src && !coverImg.src.includes("/static/img/default.png"));

    if (!hasValidCover) {
        return showAlert("Copertina obbligatoria", 'warning');
    }

    // Disable buttons and show loading
    const saveBtn = document.getElementById("finalUpload");
    const searchBtn = document.getElementById("search-meta");
    saveBtn.disabled = true;
    searchBtn.disabled = true;
    saveBtn.textContent = "Salvataggio...";

    // Gather shared metadata
    const artist = document.getElementById("artist").value;
    const album = document.getElementById("album").value;
    const genre = document.getElementById("genre").value;
    const release_date = document.getElementById("release_date").value;

    // Gather track data from inputs
    const trackTitleInputs = document.querySelectorAll(".track-title");
    const trackNumberInputs = document.querySelectorAll(".track-number");
    const tracksData = [];

    trackTitleInputs.forEach((input, index) => {
        const track = batchTracks[index];
        const trackNumber = trackNumberInputs[index]?.value || (index + 1);
        tracksData.push({
            temp_file: track.temp_file,
            title: input.value || track.title,
            duration: track.duration,
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
        const data = await apiRequest("/api/upload-final-batch", {
            method: "POST",
            body: formData
        });

        if (data.errors && data.errors.length > 0) {
            showAlert(data.message + ": " + data.errors.join(", "), 'warning');
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
