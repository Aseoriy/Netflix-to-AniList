# Netflix-to-AniList
Simple chrome extension which syncs your netflix activity with AniList

## What's Included

- **Extension Framework:** All the necessary files (`manifest.json`, background worker, content scripts, and a popup UI).
- **AniList Authentication:** Integrated OAuth2 login using the `41599` Client ID you provided.
- **Netflix Tracking:** A content script that monitors the Netflix player for the show title and episode number.
- **Customizable Settings:** 
  - Choose between updating on "Next Episode Click" or after a specific "Percentage Watched".
  - A beautiful, glassmorphic UI.

## Next Steps for You

Since this extension is not on the Chrome Web Store right now, you need to load it as an "Unpacked Extension" in Chrome. Here is how to do it and link it to your AniList app:

> [!IMPORTANT]
> **Step 1: Load the Extension**
> 1. Open Google Chrome (or any chromium based browser) and go to `chrome://extensions/` (or whatever your browser is, for me its vivaldi:extensions as i use vivaldi) .
> 2. Enable **Developer mode** (toggle in the top right corner).
> 3. Click the **Load unpacked** button.
> 4. Select the `Anilist Extension` folder.

> [!TIP]
> **Step 2: Connect and Test!**
> 1. Open the extension popup again and click **Connect AniList**.
> 2. It will ask you to log in to AniList and authorize the app.
> 3. Once connected, open Netflix, start watching an anime, and let me know if it tracks properly!
