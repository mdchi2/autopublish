// DOM Elements
const terminal = document.getElementById('terminal');
const timerDisplay = document.getElementById('timer-display');
const btnToggle = document.getElementById('btn-toggle');

const statusIndicator = document.getElementById('status-indicator');
const cycleCount = document.getElementById('cycle-count');

const versePreview = document.getElementById('verse-preview');
const verseTitle = document.getElementById('verse-title');

// State
let isRunning = false;
let timeRemaining = 3600; // 1 hour in seconds
let timerInterval = null;
let cycles = 0;

// Utility functions
function formatTime(seconds) {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
}

function log(message, type = 'info') {
    const time = new Date().toLocaleTimeString('es-ES', { hour12: false });
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    entry.innerHTML = `<span class="time">[${time}]</span> ${message}`;
    terminal.appendChild(entry);
    terminal.scrollTop = terminal.scrollHeight;
}



// Logic Functions
function getVersiculo() {
    const k = Math.floor(Math.random() * 77) + 1;
    const l = k < 10 ? "0" + k : "" + k;
    const verenl = `https://mdchi.github.io/versiculo/jpg/0${l}.jpg`;
    
    // Simplification for the example, we just use a generic title if not matched fully
    let vertit = `Versículo #${k}`;
    if (k === 1) vertit = "Amado deseo que seas prosperado en todo";
    else if (k === 2) vertit = "Antes que te formase en el vientre te conoci";
    else if (k === 20) vertit = "El Señor es mi pastor";
    else if (k === 77) vertit = "Yo soy la Luz del mundo";
    
    return { vertit, verenl, l };
}

// API Calls (Real)
async function sendToTelegram(texto) {
    try {
        const bottoken = "8588587058:AAG2w308Rt5Ij9SAOtKr5KBBlMvfQ0uQLUo";
        const chatid = "-1001292141798";
        const url = `https://api.telegram.org/bot${bottoken}/sendMessage`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chatid, text: texto })
        });
        
        if (!response.ok) throw new Error("Error en respuesta de Telegram");
        log("Telegram: enlace publicado exitosamente", "success");
    } catch (error) {
        log(`Telegram Error: ${error.message}`, "error");
    }
}

async function sendToInstagram(imageurl, titulo, link) {
    try {
        const caption = titulo + " " + (link ? link : "");
        const version = 'v21.0';
        const accesstoken = "EAANJx5gaetABO3hQzqWqd7kSDNfk7pdWOpm8EFpPHKxd3hXnWeSwP5azYyvW122euJZBIJ79HsRbp829TWZATBNmBpgGmKi92lMiaThY475e7koBVsXAZCrzrc8tnmzFOfvVMUZB2YQ1l3PlzPrTOyGLyZAzugEXk1QyHXhEqRt6BViRBEVYJVW566L9ZBACP6SZBM9QmLr";
        const iguserid = "17841402522748943";

        // Paso 1: Crear el contenedor de media
        const posturl = `https://graph.facebook.com/${version}/${iguserid}/media`;
        const payload1 = new URLSearchParams({
            image_url: imageurl,
            caption: caption,
            access_token: accesstoken
        });

        const r1 = await fetch(posturl, { method: 'POST', body: payload1 });
        const results = await r1.json();
        
        if (results.error) throw new Error(results.error.message);
        const creationid = results.id;

        // Paso 2: Publicar
        const posturl2 = `https://graph.facebook.com/${version}/${iguserid}/media_publish`;
        const payload2 = new URLSearchParams({
            creation_id: creationid,
            access_token: accesstoken
        });

        let res2;
        let retries = 3;
        let published = false;

        log("Instagram: Esperando a que Meta procese la imagen...", "info");

        while (retries > 0 && !published) {
            // Esperar 5 segundos para que los servidores de Meta descarguen y procesen la imagen
            await new Promise(resolve => setTimeout(resolve, 5000));

            const r2 = await fetch(posturl2, { method: 'POST', body: payload2 });
            res2 = await r2.json();

            if (res2.error) {
                // Código 90010 o mensaje específico significa que el contenedor no está listo
                if (res2.error.code === 90010 || res2.error.message.includes("Media ID is not available")) {
                    retries--;
                    if (retries === 0) throw new Error(res2.error.message);
                    log(`Instagram: Contenedor no listo, reintentando... (${retries} intentos restantes)`, "info");
                } else {
                    throw new Error(res2.error.message);
                }
            } else {
                published = true;
            }
        }
        log("Instagram: publicado exitosamente", "success");
    } catch (error) {
        log(`Instagram Error: ${error.message}`, "error");
    }
}

// Main Routine
async function runRoutine() {
    log("Iniciando ciclo de publicación...", "info");
    cycles++;
    cycleCount.innerText = cycles;

    // 1. Versículo
    const verse = getVersiculo();
    log(`Versículo Info: #${verse.l} - ${verse.vertit}`, "info");
    versePreview.innerHTML = `<img src="${verse.verenl}" alt="Versiculo">`;
    verseTitle.innerText = verse.vertit;

    // 2. APIs
    await sendToInstagram(verse.verenl, verse.vertit);
    
    log("Ciclo completado con éxito.", "success");
    
    // Reset Timer
    timeRemaining = 3600;
    updateTimerDisplay();
}

// Timer Management
function updateTimerDisplay() {
    timerDisplay.innerText = formatTime(timeRemaining);
}

async function tick() {
    if (!isRunning) return;
    
    timeRemaining--;
    updateTimerDisplay();
    
    if (timeRemaining <= 0) {
        clearInterval(timerInterval);
        await runRoutine();
        if (isRunning) {
            timerInterval = setInterval(tick, 1000);
        }
    }
}

// Events
btnToggle.addEventListener('click', async () => {
    isRunning = !isRunning;
    if (isRunning) {
        btnToggle.innerText = "Pausar Bot";
        btnToggle.classList.add('active');
        statusIndicator.innerText = "Activo";
        statusIndicator.classList.add('active');
        log("Bot iniciado. Ejecutando publicaciones...", "system");
        
        await runRoutine();
        
        if (isRunning) {
            timerInterval = setInterval(tick, 1000);
        }
    } else {
        btnToggle.innerText = "Iniciar Bot";
        btnToggle.classList.remove('active');
        statusIndicator.innerText = "Pausado";
        statusIndicator.classList.remove('active');
        log("Bot pausado.", "system");
        clearInterval(timerInterval);
    }
});



// Init
updateTimerDisplay();
