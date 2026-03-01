# Project Strategy & User Manual: Oman Air FTL WebApp

## 1. Project Strategy and Architecture

### 1.1 Overview
The goal of this project was to automate the calculation of the **Maximum Flight Duty Period (FDP)** and its subsequent limits under **PIC (Pilot-in-Command) Discretion**, as outlined in Section 7 of the Oman Air manual. To ensure maximum availability, compatibility, and a frictionless experience for crews around the world, an **Offline-First Progressive Web App (PWA)** architectural approach was chosen.

### 1.2 Technology Stack
*   **Vanilla HTML5 & JavaScript:** Used to ensure the application executes instantly without requiring heavy frameworks (like React or Angular). This dramatically minimizes the load time and storage footprint.
*   **Modern CSS (Glassmorphism):** Instead of using pre-built libraries like Bootstrap or Tailwind, custom CSS was implemented utilizing CSS Variables and a dynamic "Glass" aesthetic to ensure a premium look.
*   **PWA Capabilities (Offline Functionality):** 
    *   **`manifest.json`:** Provides the operating system with the metadata required to "install" the web app to the home screen or desktop masquerading as a native application.
    *   **Service Worker (`sw.js`):** Intercepts network requests and caches the UI and Logic scripts locally. This enables the app to open and fully function even if the device is in "Airplane Mode" without internet access.

### 1.3 OS Detection & Dynamic Styling
One of the critical requirements was for the app to feel native on whatever device it's opened. 
A JavaScript handler evaluates `navigator.userAgent` to detect the Operating System (iOS, Android, Windows, Mac). Depending on the result, a specific class (e.g., `.ios`, `.android`) is injected into the root HTML body. 
The CSS leverages these classes to dynamically change visual behaviors. For example:
*   **iOS/macOS:** Inputs get lighter inner shadows, and toggle switches mimic the native Apple rounded-green style.
*   **Android:** Cards become squarer (Material Design), inputs emphasize the bottom border instead of full outlines, and buttons use uppercase lettering with dynamic drop shadows.

### 1.4 Business Logic (Section 7 OM-A)
The algorithm strictly enforces:
*   **Zulu to Local Time Conversion:** Users input Zulu (UTC) time and choose their Local Offset. The script converts it instantly to match the Time Bands in **Table A (Acclimatised)**.
*   **WOCL/Midnight Crossing:** The calculation correctly handles timeframes stretching over midnight (e.g., 22:00 to 05:59).
*   **Table B (Not Acclimatised):** Bypasses local time parsing altogether and simply relies on the preceding rest hours.
*   **PIC Discretion:** Automatically calculates the maximum +3:00 hours extension on top of the base FDP limit to generate the "Extended End Time".

---

## 2. User Manual

### Installation (Mobile & Desktop)
Because this is a Progressive Web App, it does not need to be downloaded from the App Store or Google Play.
1.  Open the application link in your browser (e.g., Safari on iPhone, Chrome on Android/Windows).
2.  **iOS:** Tap the "Share" icon at the bottom, scroll down, and tap **"Add to Home Screen"**.
3.  **Android/Windows (Chrome):** Tap the Settings Menu (three dots) and select **"Install App"** or click the install icon in the top URL bar.
4.  The FTL Calculator is now installed as a standalone app and can be opened offline without the browser interface.

### How to Compute Limits
1.  **Report Time (Zulu):** Enter your scheduled reporting time in UTC format.
2.  **Local Timezone Offset:** Select the timezone of the aerodrome you are reporting at (e.g., UTC +04:00 for Oman).
    *(The system will automatically calculate the local time below the results)*.
3.  **Number of Sectors:** Select how many sectors are planned for the duty.
4.  **Acclimatised Switch:** 
    *   Leave toggled ON if you are acclimatised to the local timezone (Uses Table A).
    *   Toggle OFF if you are not acclimatised (Uses Table B). A new dropdown will appear asking you to specify your preceding rest hours.
5.  Press **"Calculate Limits"**.

### Understanding the Results
*   **Local Report Time:** Your Zulu input mathematically shifted to the layout of the local departure.
*   **Max Flight Duty Period (FDP):** Your maximum allowed flying hours derived from OM-A tables.
*   **Duty End Time (Local):** The exact local time your standard duty ends (`Local Report Time` + `Max FDP`).
*   **Total Max FDP & Extended End Time:** Calculations showing absolute hard limits if the Commander exercises their maximum 3-hour discretion.
