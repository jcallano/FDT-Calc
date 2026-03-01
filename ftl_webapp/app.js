// FTL Calculator App Logic

// OS Detection
function detectOS() {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    const badge = document.getElementById('osBadge');

    // Windows Phone must come first because its UA also contains "Android"
    if (/windows phone/i.test(userAgent)) {
        document.body.classList.add('windows');
        badge.textContent = 'Windows Phone';
        return 'Windows Phone';
    }
    if (/android/i.test(userAgent)) {
        document.body.classList.add('android');
        badge.textContent = 'Android';
        return 'Android';
    }
    // iOS detection
    if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
        document.body.classList.add('ios');
        badge.textContent = 'iOS';
        return 'iOS';
    }
    // Mac detection
    if (/Macintosh|MacIntel|MacPPC|Mac68K/.test(userAgent)) {
        document.body.classList.add('desktop', 'mac');
        badge.textContent = 'macOS';
        return 'macOS';
    }
    // Windows Desktop Default
    document.body.classList.add('desktop', 'windows');
    badge.textContent = 'Windows PC';
    return 'Windows';
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
    detectOS();

    // UI Logic
    const acclimatisedCheck = document.getElementById('acclimatised');
    const prevRestGroup = document.getElementById('prevRestGroup');
    const form = document.getElementById('ftlForm');
    const resultCard = document.getElementById('resultCard');

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

        const timeZulu = document.getElementById('timeZulu').value; // HH:MM
        const tzOffset = parseInt(document.getElementById('tzOffset').value, 10);
        const sectorsIdx = parseInt(document.getElementById('sectors').value, 10) - 1;
        const isAcclimatised = document.getElementById('acclimatised').checked;
        const prevRest = document.getElementById('prevRest').value;

        if (!timeZulu) return;

        // Calculate Local Time
        let zuluMin = timeStringToInt(timeZulu);
        let localMin = zuluMin + (tzOffset * 60);

        // Handle negative & > 24h
        if (localMin < 0) localMin += 24 * 60;
        localMin = localMin % (24 * 60);

        const locH = Math.floor(localMin / 60);
        const locM = localMin % 60;
        const localTimeStr = `${String(locH).padStart(2, '0')}:${String(locM).padStart(2, '0')}`;

        document.getElementById('resLocalTime').textContent = localTimeStr;

        let maxFDP = '--';

        if (isAcclimatised) {
            maxFDP = calcMaxFDPTableA(localMin, sectorsIdx);
        } else {
            maxFDP = calcMaxFDPTableB(prevRest, sectorsIdx);
        }

        document.getElementById('resMaxFdp').textContent = maxFDP;

        let localEndTime = addTime(localTimeStr, maxFDP);
        document.getElementById('resBaseEndTime').textContent = localEndTime;

        document.getElementById('resTotalFdp').textContent = addTime(maxFDP, '03:00'); // PIC discretion is up to 3 hours
        document.getElementById('resExtendedEndTime').textContent = addTime(localEndTime, '03:00');

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
