# 📸 Yearbook — Daily Photo Timelapse & Creative Studio PWA

An elegant, privacy-first Progressive Web App (PWA) built with **Next.js 16 (App Router)**, **TypeScript**, **Tailwind CSS**, **IndexedDB (Dexie.js)**, and **MongoDB Atlas** cloud synchronization.

---

## ✨ Features

- **🗓️ Photo Yearbook & Growth Timelapse**: Log daily selfies/photos with customizable dates, streak counters, and month calendar navigation.
- **👁️ Zero-Manual Automatic Eye & Face Alignment**: Real-time client-side computer vision automatically aligns eyes horizontally (50%) and vertically (38%) so timelapses morph smoothly with zero face jitter.
- **👻 Onion-Skin Ghost Reference Layer**: Overlay the previous day's photo with adjustable transparency to match your pose and facial features with 100% precision.
- **💬 Snapchat-Style Overlay Captions**: Frosted draggable caption bar with customizable text, date badges, and day counters.
- **📚 Multi-Yearbook Management**: Create and switch between multiple named series (*"Daily Face Timelapse"*, *"Hair Growth"*, *"Gym Journey"*, *"Pet Growth"*).
- **🗜️ Lossless Client-Side Compression**: High-fidelity WebP compression reduces file sizes by 60–80% with zero quality loss.
- **🍃 MongoDB Atlas Cloud Sync**: Hybrid offline-first architecture — instantaneous local storage with seamless background cloud sync across all your devices.
- **🎬 Timelapse Video Export**: High-speed video rendering (1 to 15 FPS) with direct `.webm` video download.

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
Create a `.env.local` file:
```env
MONGODB_URI=your_mongodb_connection_string
MONGODB_DB=pixelforge
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🌐 Deploy to Vercel (100% Free)

1. Push this repository to your GitHub:
   ```bash
   git add .
   git commit -m "Initial commit"
   git push -u origin main
   ```
2. Import the project in [Vercel](https://vercel.com).
3. Add your `MONGODB_URI` and `MONGODB_DB` under **Project Settings → Environment Variables**.
4. Click **Deploy**!
