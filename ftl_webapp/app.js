// FTL Calculator App Logic

function detectOS() {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    const badge = document.getElementById('osBadge');

    // Función par inyectar clases a nivel HTML y Body asegurando compatibilidad CSS
    const setOSClass = (osClass, text) => {
        document.documentElement.classList.add(osClass);
        document.body.classList.add(osClass);
        if (badge) badge.textContent = text;
    };

    // Windows Phone 
    if (/windows phone/i.test(userAgent)) {
        setOSClass('windows', 'Windows Phone');
        return 'Windows Phone';
    }
    // Android
    if (/android/i.test(userAgent)) {
        setOSClass('android', 'Android');
        return 'Android';
    }
    // iOS detection (including iPadOS 13+ which masks as Mac)
    const isIOS = /iPad|iPhone|iPod/.test(userAgent) ||
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

    if (isIOS && !window.MSStream) {
        setOSClass('ios', 'iOS');
        return 'iOS';
    }
    // Mac detection
    if (/Macintosh|MacIntel|MacPPC|Mac68K/.test(userAgent)) {
        document.documentElement.classList.add('desktop', 'mac');
        document.body.classList.add('desktop', 'mac');
        if (badge) badge.textContent = 'macOS';
        return 'macOS';
    }
    // Windows Desktop Default
    document.documentElement.classList.add('desktop', 'windows');
    document.body.classList.add('desktop', 'windows');
    if (badge) badge.textContent = 'Windows PC';
    return 'Windows';
}

function applyMobileOptimizations(osLabel) {
    const timeInput = document.getElementById('timeLocal');
    if (osLabel === 'iOS' || osLabel === 'Android' || osLabel === 'Windows Phone') {
        // En móviles, restaurar el tipo 'time' para aprovechar sus hermosas ruletas nativas
        timeInput.type = 'time';
        timeInput.removeAttribute('inputmode');
        timeInput.removeAttribute('pattern');
        timeInput.removeAttribute('maxlength');
        timeInput.placeholder = '';
    } else {
        // En Desktop mantener 'text' con patrón 'HHMM' para sortear problemas de AM/PM
        timeInput.type = 'text';
    }
}

// FTL Data Tables (Section 7 OM-A)
// Table A: Acclimatised (Sectors 1 to 8+)
const tableA = [
    { start: 360, end: 479, sectors: ['13:00', '12:15', '11:30', '10:45', '10:00', '09:30', '09:00', '09:00'] }, // 06:00 - 07:59
    { start: 480, end: 779, sectors: ['14:00', '13:15', '12:30', '11:45', '11:00', '10:30', '10:00', '09:30'] }, // 08:00 - 12:59
    { start: 780, end: 1079, sectors: ['13:00', '12:15', '11:30', '10:45', '10:00', '09:30', '09:00', '09:00'] },// 13:00 - 17:59
    { start: 1080, end: 1319, sectors: ['12:00', '11:15', '10:30', '09:45', '09:00', '09:00', '09:00', '09:00'] },// 18:00 - 21:59
    // 22:00 to 05:59 handled specifically because it crosses midnight
    { start: 1320, end: 359, sectors: ['11:00', '10:15', '09:30', '09:00', '09:00', '09:00', '09:00', '09:00'] }
];

// Table B: Not Acclimatised
const tableB = {
    'over30': ['13:00', '12:15', '11:30', '10:45', '10:00', '09:15', '09:00', '09:00'],
    'between18and30': ['11:30', '11:00', '10:30', '09:45', '09:00', '09:00', '09:00', '09:00']
};

function timeStringToInt(timeStr) {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
}

function calcMaxFDPTableA(localTimeMinutes, sectorsIdx) {
    for (let i = 0; i < tableA.length; i++) {
        const band = tableA[i];
        if (band.start > band.end) {
            // crosses midnight (22:00 to 05:59)
            if (localTimeMinutes >= band.start || localTimeMinutes <= band.end) return band.sectors[sectorsIdx];
        } else {
            if (localTimeMinutes >= band.start && localTimeMinutes <= band.end) return band.sectors[sectorsIdx];
        }
    }
    return '--';
}

function calcMaxFDPTableB(prevRest, sectorsIdx) {
    return tableB[prevRest][sectorsIdx];
}

// Add hours helper (t1 string "HH:MM", t2 string "HH:MM" or number)
function addTime(t1, t2) {
    if (t1 === '--' || t2 === '--') return '--';
    let [h1, m1] = t1.split(':').map(Number);
    let h2 = 0, m2 = 0;

    if (typeof t2 === 'string' && t2.includes(':')) {
        [h2, m2] = t2.split(':').map(Number);
    } else {
        h2 = Number(t2);
    }

    let outM = m1 + m2;
    let outH = h1 + h2 + Math.floor(outM / 60);
    outM = outM % 60;
    outH = outH % 24; // Keeps it within 24h clock for End Time

    return `${String(outH).padStart(2, '0')}:${String(outM).padStart(2, '0')}`;
}

// DOM Elements & Events
document.addEventListener('DOMContentLoaded', () => {
    const currentOS = detectOS();
    applyMobileOptimizations(currentOS);

    // UI Logic
    const acclimatisedCheck = document.getElementById('acclimatised');
    const prevRestGroup = document.getElementById('prevRestGroup');
    const form = document.getElementById('ftlForm');
    const resultCard = document.getElementById('resultCard');

    // UI Logic PIC Discretion
    const picDiscretion = document.getElementById('picDiscretion');
    const picLabel2 = document.getElementById('picLabel2');
    const picLabel3 = document.getElementById('picLabel3');

    picDiscretion.addEventListener('change', (e) => {
        if (e.target.checked) {
            picLabel3.style.fontWeight = 'bold';
            picLabel3.style.color = 'var(--warning-color)';
            picLabel2.style.fontWeight = 'normal';
            picLabel2.style.color = 'var(--text-secondary)';
        } else {
            picLabel2.style.fontWeight = 'bold';
            picLabel2.style.color = 'var(--warning-color)';
            picLabel3.style.fontWeight = 'normal';
            picLabel3.style.color = 'var(--text-secondary)';
        }
    });

    acclimatisedCheck.addEventListener('change', (e) => {
        if (e.target.checked) {
            prevRestGroup.style.display = 'none';
        } else {
            prevRestGroup.style.display = 'flex';
        }
    });

    // Form Submit
    form.addEventListener('submit', (e) => {
        e.preventDefault();

        let rawTime = document.getElementById('timeLocal').value.replace(':', '');
        if (rawTime.length < 3 || rawTime.length > 4) {
            alert("Formato Inválido. Usa formato 24h como 0830 o 1445.");
            return;
        }

        // Pad with leading zero if they typed 3 digits e.g. "830" -> "0830"
        rawTime = rawTime.padStart(4, '0');
        const hStr = rawTime.substring(0, 2);
        const mStr = rawTime.substring(2, 4);
        const timeLocalStr = `${hStr}:${mStr}`;

        const tzOffset = parseInt(document.getElementById('tzOffset').value, 10);
        const sectorsIdx = parseInt(document.getElementById('sectors').value, 10) - 1;
        const isAcclimatised = document.getElementById('acclimatised').checked;
        const prevRest = document.getElementById('prevRest').value;

        // Base minutes for calculations
        let localMin = timeStringToInt(timeLocalStr);
        let zuluMin = localMin - (tzOffset * 60);

        // Handle negative & > 24h for Zulu
        if (zuluMin < 0) zuluMin += 24 * 60;
        zuluMin = zuluMin % (24 * 60);

        // Oman is UTC + 4
        let omanMin = zuluMin + (4 * 60);
        if (omanMin < 0) omanMin += 24 * 60;
        omanMin = omanMin % (24 * 60);

        // Helper string builder
        const toHHMM = (min) => `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;

        const timeZuluStr = toHHMM(zuluMin);
        const timeOmanStr = toHHMM(omanMin);

        // Calculate Max FDP
        let maxFDP = '--';
        if (isAcclimatised) {
            maxFDP = calcMaxFDPTableA(localMin, sectorsIdx);
        } else {
            maxFDP = calcMaxFDPTableB(prevRest, sectorsIdx);
        }

        document.getElementById('resMaxFdp').textContent = maxFDP;

        // --- Calculate End Times ---

        // 1. Base End Time
        let endLocalStr = addTime(timeLocalStr, maxFDP);
        let endZuluStr = addTime(timeZuluStr, maxFDP);
        let endOmanStr = addTime(timeOmanStr, maxFDP);

        document.getElementById('resBaseEndTimeLocal').textContent = endLocalStr + ' Local';
        document.getElementById('resBaseEndTimeZulu').textContent = endZuluStr + ' Zulu';
        document.getElementById('resBaseEndTimeOman').textContent = endOmanStr + ' Oman';

        // 2. Extended FDP & Extended End Time (PIC Extension)
        const picExtendHours = document.getElementById('picDiscretion').checked ? '03:00' : '02:00';
        document.getElementById('resPicDiscretion').textContent = `Up to ${parseInt(picExtendHours)} hours`;

        let totalFdpStr = addTime(maxFDP, picExtendHours);
        document.getElementById('resTotalFdp').textContent = totalFdpStr;

        let extLocalStr = addTime(endLocalStr, picExtendHours);
        let extZuluStr = addTime(endZuluStr, picExtendHours);
        let extOmanStr = addTime(endOmanStr, picExtendHours);

        document.getElementById('resExtendedEndTimeLocal').textContent = extLocalStr + ' Local';
        document.getElementById('resExtendedEndTimeZulu').textContent = extZuluStr + ' Zulu';
        document.getElementById('resExtendedEndTimeOman').textContent = extOmanStr + ' Oman';

        resultCard.style.display = 'block';
    });
});

// PWA Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').then(registration => {
            console.log('SW registered: ', registration);
        }).catch(err => {
            console.log('SW registration failed: ', err);
        });
    });
}

// PWA Install Prompt Logic
let deferredPrompt;
const installPromotion = document.getElementById('installPromotion');
const installBtn = document.getElementById('installBtn');

window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();
    // Stash the event so it can be triggered later.
    deferredPrompt = e;
    // Update UI notify the user they can install the PWA
    installPromotion.style.display = 'flex';
});

installBtn.addEventListener('click', async () => {
    // Hide the app provided install promotion
    installPromotion.style.display = 'none';
    // Show the install prompt
    if (deferredPrompt) {
        deferredPrompt.prompt();
        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);
        // We've used the prompt, and can't use it again, throw it away
        deferredPrompt = null;
    }
});

window.addEventListener('appinstalled', () => {
    // Hide the app-provided install promotion
    installPromotion.style.display = 'none';
    // Clear the deferredPrompt so it can be garbage collected
    deferredPrompt = null;
    console.log('PWA was installed');
});
