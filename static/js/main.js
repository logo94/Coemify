import { firstUpload, finalUpload } from "./upload.js";
import { loadOptions, checkDuplicates, loadArtistAlbums } from "./api.js";
import { debounce, openCoverDialog, previewCover } from "./utils.js";
import { searchMetadata } from "./musicbrainz.js";

document.addEventListener("DOMContentLoaded", async () => {

    const dropZone = document.getElementById("dropZone");
    const fileInput = document.getElementById("audioFile");

    const uploadForm = document.getElementById("uploadForm")
    const coverFile = document.getElementById("coverFile")
    const coverBtn = document.getElementById("uploadCoverBtn")
    const metadataForm = document.getElementById("metadataForm")
    const metaBtn = document.getElementById("search-meta")
    const finalUploadBtn = document.getElementById("finalUpload")

    // Popolamento tendine
    await loadOptions();

    /* CLICK → file picker */
    dropZone.addEventListener("click", () => {
        fileInput.click();
    });

    ["dragenter", "dragover", "dragleave", "drop"].forEach(event => {
        dropZone.addEventListener(event, e => {
            e.preventDefault();
            e.stopPropagation();
        });
    });

    dropZone.addEventListener("dragover", () => {
        dropZone.classList.add("dragover");
    });

    dropZone.addEventListener("dragleave", () => {
        dropZone.classList.remove("dragover");
    });

    dropZone.addEventListener("drop", async (e) => {
        dropZone.classList.remove("dragover");
        const files = e.dataTransfer.files;
        await firstUpload(files);
        await checkDuplicates();
    });

    fileInput.addEventListener("change", async () => {
        const files = fileInput.files;
        await firstUpload(files);
        await checkDuplicates();
    });

    uploadForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        const files = fileInput.files;
        await firstUpload(files);
        await checkDuplicates();
    })

    let debounceTimeout;

    // Aggiungi i listener con debounce
    document.getElementById("artist").addEventListener("input", debounce(debounceTimeout, checkDuplicates, 500));
    document.getElementById("artist").addEventListener("input", debounce(debounceTimeout, loadArtistAlbums, 500));

    coverBtn.addEventListener("click", (event) => {
        coverFile.click();
    })

    coverFile.addEventListener("change", (event) => {
        openCoverDialog(event);
        previewCover(event);
    })
    
    metaBtn.addEventListener("click", async (event) => {
        event.preventDefault();

        await searchMetadata();
    })

    finalUploadBtn.addEventListener("click", async (event) => {
        event.preventDefault();

        await finalUpload();
    })


});