export function normalizeValue(v) {
    if (!v) return "";
    if (typeof v === "string") return v;
    if (typeof v === "object" && v.name) return v.name;
    return "";
}

// Alert output
export const showAlert = (message, type) => {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.role = 'alert';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close" style="font-size: 0.75em; margin-top: 0.25em;"></button>
    `;
    alertContainer.appendChild(alertDiv);
    setTimeout(() => {
        alertDiv.classList.remove('show');
        alertDiv.addEventListener('transitionend', () => {
            alertDiv.remove();
        }, { once: true });
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.remove();
            }
        }, 600);
    }, 10000);
}

export function openCoverDialog() {
    document.getElementById("coverFile").click();  // Trigger il click sul file input
}

export function previewCover(event) {
    console.log(event.target.files)
    const file = event.target.files[0];  // Recupera il file selezionato
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById("coverImg").src = e.target.result;  // Imposta l'anteprima dell'immagine
        };
        reader.readAsDataURL(file);
    }
}

export function getReleaseYear(releaseDate) {
    if (!releaseDate || releaseDate === "-") return "-";
    const parsedDate = new Date(releaseDate);
    if (isNaN(parsedDate)) return "";
    return parsedDate.getFullYear();
}

// Funzione di debounce
export function debounce(debounceTimeout, fn, delay) {
        return function(...args) {
            clearTimeout(debounceTimeout);  // Cancella il timeout precedente
            debounceTimeout = setTimeout(() => fn(...args), delay);  // Imposta un nuovo timeout
        };
    }