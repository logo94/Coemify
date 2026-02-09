import { firstUpload, finalUpload, batchFirstUpload, batchFinalUpload, isBatchMode } from "./upload.js";
import { loadOptions, checkDuplicates, loadArtistAlbums } from "./api.js";
import { debounce, openCoverDialog, previewCover } from "./utils.js";
import { searchMetadata } from "./musicbrainz.js";

document.addEventListener("DOMContentLoaded", async () => {

    const dropZone = document.getElementById("dropZone");
    const fileInput = document.getElementById("audioFile");
    const fileInfo = document.getElementById("fileInfo");

    const uploadForm = document.getElementById("uploadForm")
    const coverFile = document.getElementById("coverFile")
    const coverBtn = document.getElementById("uploadCoverBtn")
    const metadataForm = document.getElementById("metadataForm")
    const metaBtn = document.getElementById("search-meta")
    const finalUploadBtn = document.getElementById("finalUpload")

    // Popolamento tendine (non-blocking, dropdowns fill in background)
    loadOptions();

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
        if (files.length > 0) {
            fileInput.files = files;

            if (files.length > 1) {
                // Multi-file batch upload
                fileInfo.value = `${files.length} file selezionati`;
                await batchFirstUpload(files);
            } else {
                // Single file upload
                const file = files[0];
                fileInfo.value = `${file.name.replace(".mp3", "")}`;
                await firstUpload();
                await checkDuplicates();
            }
        }
    });

    fileInput.addEventListener("change", async () => {
        const files = fileInput.files;
        if (files.length > 0) {
            if (files.length > 1) {
                // Multi-file batch upload
                fileInfo.value = `${files.length} file selezionati`;
                await batchFirstUpload(files);
            } else {
                // Single file upload
                const file = files[0];
                fileInfo.value = `${file.name.replace(".mp3", "")}`;
                await firstUpload();
                await checkDuplicates();
            }
        }
    });

    let debounceTimeout;

    // Aggiungi i listener con debounce
    document.getElementById("title").addEventListener("input", debounce(debounceTimeout, checkDuplicates, 500));
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

    uploadForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        await firstUpload();
        await checkDuplicates();
    })

    finalUploadBtn.addEventListener("click", async (event) => {
        event.preventDefault();

        if (isBatchMode()) {
            await batchFinalUpload();
        } else {
            await finalUpload();
        }
    })


});