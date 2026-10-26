# Google Calendar Maps in New Tab

A lightweight Chrome/Chromium extension (Manifest V3) that stops Google Calendar from opening the embedded Google Maps side panel when clicking an event location, opening Google Maps in a new tab instead.

## Features

- Intercepts clicks on event locations in Google Calendar popovers (`#xDetDlgLoc`), direct Google Maps links, and "Preview in Maps" buttons.
- Prevents Google Calendar's internal `jsaction` handlers from opening the Google Maps side panel.
- Preserves secondary actions like the **Copy location** button.
- Zero background processes, `MutationObserver` loops, or extra permissions required.

## Installation (Unpacked Extension)

1. Clone or download this repository.
2. Open Chrome and navigate to `chrome://extensions/`.
3. Enable **Developer mode** using the toggle in the top-right corner.
4. Click **Load unpacked** in the top-left corner and select this repository folder.
5. Refresh any open Google Calendar tabs.
