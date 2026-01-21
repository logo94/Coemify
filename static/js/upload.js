import { apiRequest } from "./api.js";
import { showAlert } from "./utils.js";

export async function firstUpload() {
        
    const fileInput = document.getElementById("audioFile");
    if (!fileInput.files.length) return alert("Seleziona un file!");

    const formData = new FormData();
    formData.append("file", fileInput.files[0]);

    // Mostra lo spinner di caricamento
    const spinner = document.getElementById("uploadSpinner");
    spinner.style.display = "inline-block";

    // Nascondi lo spinner dopo la risposta
    spinner.style.display = "none";

    const data = await apiRequest("/api/upload-temp", {
        method: "POST",
        body: formData
    })

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

    if (md.cover) {
        document.getElementById("coverImg").src = md.cover;
    }

    // Salva il path temporaneo
    document.getElementById("tempFile").value = data.temp_file;
}

export async function finalUpload() {
    
    const formData = new FormData();

    // Aggiungi i dati dal form
    formData.append("temp_file", document.getElementById("tempFile").value); // File temporaneo
    formData.append("title", document.getElementById("title").value);  // Titolo
    formData.append("artist", document.getElementById("artist").value);  // Artista
    formData.append("album", document.getElementById("album").value);  // Album
    formData.append("genre", document.getElementById("genre").value);  // Genere
    formData.append("duration", document.getElementById("duration").value);  // Durata
    formData.append("release_date", document.getElementById("release_date").value);  // Anno

    // Aggiungi il file di copertura se presente
    const coverFile = document.getElementById("coverFile").files[0];
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
        
    }
}
