# AReader — Desktop App Build Instructions

## Prerequisites
- **Node.js 20+** (https://nodejs.org)
- **npm** (comes with Node)

## Step-by-step: Build the .exe on your PC

### 1. Download & extract the project zip

### 2. Open a terminal in the project folder and install dependencies
```bash
npm install
```

### 3. Build the web app
```bash
npm run build
```

### 4. Build the Windows portable .exe
```bash
npm run electron:dist
```

The `.exe` will appear in the `release/` folder:
```
release/AReader-0.0.0-Windows-Portable.exe
```

Double-click it to run. No installation needed.

### 5. (Optional) Quick test without packaging
```bash
npm run electron:dev
```
This opens the app in a local Electron window for testing.

## Notes
- The app opens **fullscreen / maximized** with no Electron menu bar.
- Press **F11** to toggle true fullscreen.
- Minimize, maximize, and close buttons are built into the top-right corner of the app.
- The `.exe` is **unsigned**, so Windows Defender may show a warning on first run. Click "More info" → "Run anyway".
- The file is ~360 MB because it bundles the full Chromium engine. This is normal for Electron apps.
