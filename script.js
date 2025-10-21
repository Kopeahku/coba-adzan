// --- VARIABEL DAN KONSTANTA ---
const ADZAN_AUDIO = document.getElementById('adzan-audio');
const API_URL = "https://api.pray.zone/v2/times/today.json"; 

// Koordinat default (misalnya Jakarta) jika geolokasi gagal
const DEFAULT_LAT = -6.200000;
const DEFAULT_LNG = 106.816666;

let sholatTimes = {}; // Objek untuk menyimpan waktu sholat yang diambil dari API

// --- FUNGSI UTAMA ---

/**
 * 1. Mendapatkan koordinat pengguna (geolokasi)
 * @returns {Promise<{lat: number, lng: number}>} - Mengembalikan Promise dengan lintang dan bujur
 */
function getLokasi() {
    return new Promise((resolve, reject) => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const lat = position.coords.latitude;
                    const lng = position.coords.longitude;
                    document.getElementById('lokasi-display').textContent = Lokasi (Latt/Long): ${lat.toFixed(4)}, ${lng.toFixed(4)};
                    resolve({ lat, lng });
                },
                (error) => {
                    console.error("Gagal mendapatkan lokasi:", error);
                    alert("Gagal mendapatkan lokasi. Menggunakan lokasi default (Jakarta).");
                    document.getElementById('lokasi-display').textContent = Lokasi Default (Jakarta);
                    resolve({ lat: DEFAULT_LAT, lng: DEFAULT_LNG });
                }
            );
        } else {
            console.error("Geolokasi tidak didukung oleh browser ini.");
            document.getElementById('lokasi-display').textContent = Lokasi Default (Jakarta);
            resolve({ lat: DEFAULT_LAT, lng: DEFAULT_LNG });
        }
    });
}

/**
 * 2. Mengambil data jadwal sholat dari API
 * @param {number} lat - Lintang
 * @param {number} lng - Bujur
 */
async function fetchSholatTimes(lat, lng) {
    try {
        const url = ${API_URL}?latitude=${lat}&longitude=${lng};
        
        // Panggil API
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(HTTP error! status: ${response.status});
        }
        const data = await response.json();

        // Menyimpan waktu sholat (misalnya Fajr, Dhuhr, Asr, Maghrib, Isha)
        // Note: API menggunakan nama Inggris, kita sesuaikan di tampilan.
        const times = data.results.datetime[0].times;
        sholatTimes = {
            'subuh': times.Fajr,
            'dzuhur': times.Dhuhr,
            'ashar': times.Asr,
            'maghrib': times.Maghrib,
            'isya': times.Isha
        };

        // 3. Menampilkan Data di HTML
        displaySholatTimes(sholatTimes);

    } catch (error) {
        console.error("Gagal mengambil data sholat:", error);
        document.getElementById('lokasi-display').textContent = "ERROR: Gagal memuat jadwal.";
    }
}

/**
 * Menampilkan waktu sholat ke elemen HTML
 * @param {object} times - Objek berisi waktu sholat
 */
function displaySholatTimes(times) {
    document.getElementById('subuh').textContent = times.subuh;
    document.getElementById('dzuhur').textContent = times.dzuhur;
    document.getElementById('ashar').textContent = times.ashar;
    document.getElementById('maghrib').textContent = times.maghrib;
    document.getElementById('isya').textContent = times.isya;
    
    // Tampilkan tanggal hari ini
    const today = new Date();
    document.getElementById('tanggal-display').textContent = today.toLocaleDateString('id-ID', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
    
    // Mulai pengecekan waktu adzan
    setInterval(checkAdzanTime, 1000); 
    updateNextSholatTime();
}

/**
 * 4. Logika Pengecekan Waktu Adzan
 */
function checkAdzanTime() {
    const now = new Date();
    // Format waktu saat ini menjadi HH:MM
    const currentTime = ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')};
    
    // Iterasi melalui setiap waktu sholat
    for (const sholatName in sholatTimes) {
        const sholatTime = sholatTimes[sholatName];
        
        // Cek apakah waktu sholat sudah tiba
        if (currentTime === sholatTime) {
            // Kita gunakan log untuk debugging, agar tidak memutar adzan setiap detik
            if (!ADZAN_AUDIO.dataset.playedToday) {
                 console.log(Waktu ${sholatName} telah tiba! Memutar Adzan...);
                 playAdzan();
                 // Tandai bahwa adzan sudah dimainkan agar tidak berulang di menit yang sama
                 ADZAN_AUDIO.dataset.playedToday = 'true';
            }
        }
    }
    
    // Setiap menit baru, reset flag agar adzan bisa berbunyi jika waktunya tepat
    if (now.getSeconds() === 0) {
        delete ADZAN_AUDIO.dataset.playedToday;
    }
    
    updateNextSholatTime();
}

/**
 * Memutar suara adzan
 */
function playAdzan() {
    // Memastikan audio diputar dari awal
    ADZAN_AUDIO.currentTime = 0; 
    // Memainkan audio
    ADZAN_AUDIO.play().catch(error => {
        // PENTING: Browser seringkali memblokir pemutaran audio otomatis.
        // Pengguna mungkin perlu berinteraksi (klik) dengan halaman sebelum adzan bisa berbunyi.
        console.error("Gagal memutar Adzan (Audio otomatis diblokir):", error);
        alert("Waktu Sholat Telah Tiba! Silakan klik di mana saja untuk mengizinkan Adzan berbunyi.");
    });
}

/**
 * Memperbarui tampilan waktu sholat berikutnya
 */
function updateNextSholatTime() {
    const now = new Date();
    const currentTimeInMinutes = now.getHours() * 60 + now.getMinutes();
    let nextSholat = null;
    let minDiff = Infinity;

    const prayerOrder = ['subuh', 'dzuhur', 'ashar', 'maghrib', 'isya'];

    for (const name of prayerOrder) {
        const timeStr = sholatTimes[name];
        if (!timeStr) continue;

        const [hours, minutes] = timeStr.split(':').map(Number);
        const sholatTimeInMinutes = hours * 60 + minutes;

        let diff = sholatTimeInMinutes - currentTimeInMinutes;
        
        // Jika waktunya sudah lewat hari ini, tambahkan 24 jam (1440 menit)
        if (diff < 0) {
            diff += 1440; 
        }

        if (diff < minDiff) {
            minDiff = diff;
            nextSholat = name;
        }
    }

    if (nextSholat) {
        document.getElementById('next-sholat').textContent = nextSholat.charAt(0).toUpperCase() + nextSholat.slice(1);
    } else {
        document.getElementById('next-sholat').textContent = "Sedang mencari...";
    }
}


// --- INICIALISASI APLIKASI ---

/**
 * Fungsi untuk memulai semua proses
 */
async function initApp() {
    const lokasi = await getLokasi();
    if (lokasi) {
        fetchSholatTimes(lokasi.lat, lokasi.lng);
    }
}

initApp();