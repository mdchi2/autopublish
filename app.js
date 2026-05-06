const youtu = [
    "https://www.youtube.com/feeds/videos.xml?channel_id=UCuAyGU-7FIvm-NC5AkyzFLw", // 0 family
    "https://www.youtube.com/feeds/videos.xml?channel_id=UCVyHsYL8OAmgixYytH4nwqg", // 1 nutricion
    "https://www.youtube.com/feeds/videos.xml?channel_id=UCzeA-vp1TsacX_uK0ha-AVw", // 2 crypto
    "https://www.youtube.com/feeds/videos.xml?channel_id=UCOaarpzsNvp4yaLSHPv9vXg", // 3 bot training
    "https://www.youtube.com/feeds/videos.xml?channel_id=UC32IvjwSWutD6Sk8xWHJAYw", // 4 sonido
    "https://www.youtube.com/feeds/videos.xml?channel_id=UCoyTRMG5VsgbQBRyCHAwVpA", // 5 tutoriales
    "https://www.youtube.com/feeds/videos.xml?channel_id=UC-_w187ULGUnBYwPLiy4uXg", // 6 market
    "https://www.youtube.com/feeds/videos.xml?channel_id=UC4WOWgIM4t22-A0od2zTVBg", // 7 cristianos
    "https://www.youtube.com/feeds/videos.xml?channel_id=UCAIOYbdfpDhdvgnXCVj_FMw", // 8 audiolibros
    "https://www.youtube.com/feeds/videos.xml?channel_id=UCmnLUFpB49Y4N-Cvlm1EOvQ"  // 9 entrenamiento
];

// DOM Elements
const terminal = document.getElementById('terminal');
const timerDisplay = document.getElementById('timer-display');
const btnToggle = document.getElementById('btn-toggle');
const btnForce = document.getElementById('btn-force');
const statusIndicator = document.getElementById('status-indicator');
const cycleCount = document.getElementById('cycle-count');

const ytPreview = document.getElementById('yt-preview');
const ytTitle = document.getElementById('yt-title');
const ytLink = document.getElementById('yt-link');

const versePreview = document.getElementById('verse-preview');
const verseTitle = document.getElementById('verse-title');

// State
let isRunning = false;
let timeRemaining = 9000; // 2.5 hours in seconds
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

async function fetchRandomYouTube() {
    const j = Math.floor(Math.random() * youtu.length);
    const feedUrl = youtu[j];
    log(`Fetch: Canal YouTube random #${j}`);
    
    try {
        // Using rss2json as a free CORS proxy for RSS feeds
        const response = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feedUrl)}`);
        const data = await response.json();
        
        if (data.status === 'ok' && data.items.length > 0) {
            const i = Math.floor(Math.random() * Math.min(15, data.items.length));
            const entry = data.items[i];
            return {
                title: entry.title,
                link: entry.link,
                thumbnail: entry.thumbnail
            };
        } else {
            throw new Error("No items in feed");
        }
    } catch (error) {
        log(`Error fetching YouTube: ${error.message}`, 'error');
        return null;
    }
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

        const r2 = await fetch(posturl2, { method: 'POST', body: payload2 });
        const res2 = await r2.json();

        if (res2.error) throw new Error(res2.error.message);
        log("Instagram: publicado exitosamente", "success");
    } catch (error) {
        log(`Instagram Error: ${error.message}`, "error");
    }
}

async function sendEmail(title, link, imageUrl) {
    try {
        const payload = { asunto: title, mensaje: link, adjunto: imageUrl };
        const response = await fetch('http://127.0.0.1:5000/api/email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || "Error al enviar email al servidor");
        }
        
        log(`WordPress (Email): Publicado exitosamente`, "success");
    } catch (error) {
        log(`WordPress (Email) Error: ${error.message}`, "error");
    }
}

// Main Routine
async function runRoutine() {
    log("Iniciando ciclo de publicación...", "info");
    cycles++;
    cycleCount.innerText = cycles;

    // 1. YouTube
    const ytData = await fetchRandomYouTube();
    if (ytData) {
        log(`YouTube Info: ${ytData.title}`, "info");
        ytPreview.innerHTML = `<img src="${ytData.thumbnail}" alt="Thumbnail">`;
        ytTitle.innerText = ytData.title;
        ytLink.href = ytData.link;
        ytLink.classList.remove('hidden');
    }

    // 2. Versículo
    const verse = getVersiculo();
    log(`Versículo Info: #${verse.l} - ${verse.vertit}`, "info");
    versePreview.innerHTML = `<img src="${verse.verenl}" alt="Versiculo">`;
    verseTitle.innerText = verse.vertit;

    // 3. APIs
    if (ytData) {
        await sendEmail(ytData.title, ytData.link, ytData.thumbnail);
        await sendToTelegram(ytData.link);
        await sendToInstagram(ytData.thumbnail, ytData.title, ytData.link);
    }
    await sendToInstagram(verse.verenl, verse.vertit);
    
    log("Ciclo completado con éxito.", "success");
    
    // Reset Timer
    timeRemaining = 9000;
    updateTimerDisplay();
}

// Timer Management
function updateTimerDisplay() {
    timerDisplay.innerText = formatTime(timeRemaining);
}

function tick() {
    if (!isRunning) return;
    
    timeRemaining--;
    updateTimerDisplay();
    
    if (timeRemaining <= 0) {
        runRoutine();
    }
}

// Events
btnToggle.addEventListener('click', () => {
    isRunning = !isRunning;
    if (isRunning) {
        btnToggle.innerText = "Pausar Bot";
        btnToggle.classList.add('active');
        statusIndicator.innerText = "Activo";
        statusIndicator.classList.add('active');
        log("Bot iniciado.", "system");
        timerInterval = setInterval(tick, 1000);
    } else {
        btnToggle.innerText = "Iniciar Bot";
        btnToggle.classList.remove('active');
        statusIndicator.innerText = "Pausado";
        statusIndicator.classList.remove('active');
        log("Bot pausado.", "system");
        clearInterval(timerInterval);
    }
});

btnForce.addEventListener('click', () => {
    runRoutine();
});

// Init
updateTimerDisplay();
