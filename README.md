# Netflix to AniList Sync

A lightweight browser extension that automatically tracks the anime you watch on Netflix and updates your progress on your AniList profile!

## Features
- **Automatic Tracking:** Updates your AniList when you click "Next Episode" or watch a certain percentage of an episode.
- **Customizable "not really":** Change the update trigger in the extension popup.
- **Premium UI:** A pretty nice design that looks great in dark mode.

---

## 🛠️ How to Install (For Any Chromium Browser)

This extension works on Google Chrome, Microsoft Edge, Brave, Opera, and other Chromium-based browsers. 

Since this extension is not currently on the Chrome Web Store, you will need to install it manually using the provided `.crx` file. It only takes a minute!

### Step 1: Download the Extension
Download the latest `Anilist Extension.crx` file from the [Releases](#) tab on this GitHub page.

### Step 2: Open your Extensions Page
Open a new tab in your browser and go to the extensions page:
- **Chrome / Brave:** Type `chrome://extensions` in the URL bar and press Enter.
- **Edge:** Type `edge://extensions` in the URL bar and press Enter.
- **Opera:** Type `opera://extensions` in the URL bar and press Enter.
- It will be the same for whatever browser you use so basically just browser://extensions

### Step 3: Enable Developer Mode
Look for a switch that says **Developer mode** (usually in the top right corner or left sidebar) and **turn it ON**. 

### Step 4: Install the `.crx` file
1. Locate the `Anilist Extension.crx` file you downloaded on your computer.
2. **Drag and drop** the `.crx` file directly anywhere onto the Extensions page you just opened.
3. Your browser will ask if you want to add the extension. Click **Add Extension**.

### Step 5: Connect your AniList!
1. Pin the extension to your toolbar for easy access.
2. Click the Netflix 'N' icon to open the extension popup.
3. Click **Connect AniList** and log in to your account.
4. Start watching anime on Netflix!

> **Note:** If your browser blocks the `.crx` installation for security reasons, you can also download the Source Code (ZIP), extract it to a folder, and click the **Load unpacked** button on the Extensions page to select the extracted folder.

---

## 🐛 Troubleshooting
- **It didn't track my episode!** Netflix's website changes frequently. Open the extension settings and try changing the "Update Trigger" from "Next Episode Button" to "Percentage Watched". 
- **"Anime not found" error?** Netflix sometimes uses slightly different titles than AniList. Currently, the extension searches AniList for the exact English/Romaji title Netflix provides. 
