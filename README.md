# OPERATION BLACK VEIL — Echoes of Sector 9

> **OPERATION BLACK VEIL — Echoes of Sector 9** adalah game *single-player tactical First-Person Shooter* (FPS) 3D berbasis web. Dibangun menggunakan Three.js, TypeScript, dan Vite, proyek ini dirancang dengan arsitektur modular yang memisahkan logika gameplay murni dari rendering 3D, dilengkapi pengujian otomatis (*Unit Test* & *End-to-End Browser Test*), serta pipeline CI/CD otomatis ke GitHub Pages.

---

## 📋 Daftar Isi

- [Latar Belakang Cerita & Konsep](#-latar-belakang-cerita--konsep)
- [Fitur Utama](#-fitur-utama)
- [Prasyarat Sistem](#-prasyarat-sistem)
- [Cara Clone & Instalasi Lokal](#-cara-clone--instalasi-lokal)
- [Panduan Kontrol Permainan](#-panduan-kontrol-permainan)
- [Arsitektur Direktori](#-arsitektur-direktori)
- [Menjalankan Pengujian Otomatis (QA)](#-menjalankan-pengujian-otomatis-qa)
- [Build Produksi & Deployment (GitHub Pages)](#-build-produksi--deployment-github-pages)
- [Lisensi & Sumber Aset](#-lisensi--sumber-aset)

---

## 📖 Latar Belakang Cerita & Konsep

Kamu diterjunkan sebagai operator elit dari **Task Force Vanguard** ke fasilitas riset militer terbengkalai bernama **Sector 9**. Misi kamu terdiri dari tiga fase berurutan:

1. **Infiltrasi (`INFILTRATE`)**: Menembus halaman luar (*courtyard*) dan masuk ke bagian dalam fasilitas riset.
2. **Pemulihan Data (`RECOVER_DATA`)**: Menemukan terminal server pusat dan mengunduh data telemetri rahasia (*Black-Box Data*).
3. **Ekstraksi (`EXTRACT`)**: Bertahan hidup dari sergapan pasukan keamanan otomatis dan mencapai titik ekstraksi di ujung utara fasilitas.

---

## ⚡ Fitur Utama

- **First-Person Controller Responsif**: Menggunakan Pointer Lock API, pergerakan WASD, Sprint, Jump, efek *head-bobbing*, dan sistem collision AABB silinder yang mulus (*wall-sliding*).
- **Sistem Senjata & Tempur Taktis**:
  - Mekanisme tembakan *Full-Auto* dan *Tap-Firing* dengan input buffer (100ms) agar setiap klik selalu responsif.
  - *Aim Down Sights* (ADS) dengan transisi FOV dan peredaman recoil.
  - Deteksi tembakan berbasis Raycasting dengan pembeda damage Headshot (2×) dan Body Shot (1×), lengkap dengan indikator visual & suara *Hitmarker*.
- **AI Musuh dengan 2 Archetype & Obstacle Avoidance**:
  - **GUARD** (Visor Oranye): Unit penembak jarak menengah yang berpatroli di waypoint dan menjaga jarak tembak.
  - **RUSHER** (Visor Merah): Unit penyerbu jarak dekat berkecepatan tinggi yang agresif mengejar pemain.
  - **Multi-Ray Steering**: AI mendeteksi dinding dan kotak pelindung di depannya untuk berbelok menghindari rintangan secara dinamis.
- **Kualitas Visual & Audio Prosedural (Zero External Bloat)**:
  - Pencahayaan atmosferik dengan PCF Soft Shadows, Exponential Fog, dan ACES Filmic Tone Mapping.
  - Tekstur PBR prosedural (lantai beton industrial, panel dinding baja, kotak kargo) dan pemuatan model 3D `.gltf` menggunakan `GLTFLoader`.
  - Efek suara sintetis real-time menggunakan Web Audio API (suara tembakan, mekanik reload, hitmarker, alarm objektif, dan dengung generator bawah tanah).
- **Pengaturan Tersimpan (`localStorage`)**: Sensitivitas mouse, volume suara, dan preset kualitas grafis (LOW, MEDIUM, HIGH).

---

## 💻 Prasyarat Sistem

Sebelum melakukan clone dan instalasi, pastikan komputer kamu sudah terpasang:

- **Git** (untuk melakukan clone repositori)
- **Node.js** versi `18.x` atau `20.x+` (disarankan LTS terbaru)
- **NPM** (bawaan dari instalasi Node.js)
- **Browser modern** yang mendukung WebGL 2.0 (Chrome, Edge, Brave, atau Firefox)

---

## 🚀 Cara Clone & Instalasi Lokal

Ikuti langkah-langkah berikut di terminal (PowerShell, Command Prompt, atau Bash):

### 1. Clone Repositori
```bash
git clone https://github.com/<username-kamu>/operation-black-veil.git
```
> *(Ganti `<username-kamu>` dengan username GitHub milikmu).*

### 2. Masuk ke Direktori Proyek
```bash
cd operation-black-veil
```

> 💡 **Tips Windows**: Hindari meletakkan folder proyek di dalam direktori yang disinkronkan secara langsung oleh OneDrive untuk mencegah kehabisan kuota ruang tulis (ENOSPC) saat menginstal `node_modules`. Gunakan direktori lokal seperti `C:\projects\operation-black-veil` atau `D:\projects\operation-black-veil`.

### 3. Instal Seluruh Dependencies
```bash
npm install
```

### 4. Jalankan Server Development
```bash
npm run dev
```

Setelah server berjalan, buka browser dan kunjungi:
```text
http://localhost:3000
```

---

## 🎮 Panduan Kontrol Permainan

| Tombol / Input | Fungsi Aksi |
| :--- | :--- |
| **W, A, S, D** | Bergerak Maju, Kiri, Mundur, Kanan |
| **Gerak Mouse** | Menoleh / Mengarahkan Pandangan Kamera |
| **Shift Kiri (Tahan)** | Sprint (Berlari Cepat) |
| **Space** | Melompat |
| **Klik Kiri (Tekan / Tahan)** | Menembak (*Single Tap* atau *Full-Auto*) |
| **Klik Kanan (Tahan)** | Membidik / *Aim Down Sights* (ADS) |
| **R** | Reload Senjata |
| **E** | Mengambil Data di Terminal Objektif |
| **ESC** | Jeda Permainan (*Pause Menu*) & Pengaturan |

---

## 📁 Arsitektur Direktori

```text
operation-black-veil/
├── .github/
│   └── workflows/
│       └── deploy.yml              # Pipeline CI/CD GitHub Actions ke GitHub Pages
├── src/
│   ├── combat/
│   │   ├── HealthSystem.ts         # Logika murni HP, damage, heal, & kematian
│   │   ├── WeaponSystem.ts         # Logika murni amunisi, cooldown, & reload
│   │   ├── WeaponSystem.test.ts    # Unit test Vitest untuk sistem senjata
│   │   └── WeaponView.ts           # Model 3D senjata, ADS, recoil, & muzzle flash
│   ├── core/
│   │   ├── GameEngine.ts           # Siklus hidup Three.js, loop utama, & sinkronisasi HUD
│   │   └── StateManager.ts         # Manajemen state (MENU, PLAYING, PAUSED, VICTORY, DEFEAT)
│   ├── enemies/
│   │   ├── EnemyAgent.ts           # State machine AI (PATROL, DETECT, PURSUE, ATTACK, DEAD)
│   │   └── EnemyManager.ts         # Mesh 3D musuh, hitbox raycast, & Line-of-Sight
│   ├── level/
│   │   ├── CollisionWorld.ts       # Resolusi collision AABB vs silinder & query raycast
│   │   └── SectorLevel.ts          # Geometri level Sector 9, lampu, & terminal objektif
│   ├── mission/
│   │   └── MissionSystem.ts        # Sistem progres 3 objektif & timer ekstraksi
│   ├── player/
│   │   ├── FirstPersonCamera.ts    # Kamera perspektif, rotasi Euler YXZ, & recoil
│   │   └── PlayerController.ts     # Kontrol gerakan WASD, gravitasi, & head-bobbing
│   ├── systems/
│   │   ├── AssetLoader.ts          # Pipeline GLTFLoader & generator tekstur PBR
│   │   ├── SettingsManager.ts      # Penyimpanan pengaturan di localStorage
│   │   └── SoundManager.ts         # Efek audio prosedural berbasis Web Audio API
│   ├── types/
│   │   └── game.ts                 # Kontrak TypeScript & eksposur test hook global
│   ├── main.ts                     # Entry point aplikasi & binding event UI
│   └── style.css                   # Styling HUD taktis & menu overlay
├── tests/
│   └── e2e/
│       └── gameplay.spec.ts        # Pengujian browser end-to-end Playwright
├── index.html                      # Markup utama & kontainer WebGL/HUD
├── package.json                    # Daftar dependencies & skrip npm
├── playwright.config.ts            # Konfigurasi Playwright E2E
├── tsconfig.json                   # Konfigurasi kompiler TypeScript
├── vite.config.ts                  # Konfigurasi bundler Vite (base path relatif)
└── vitest.config.ts                # Konfigurasi unit testing Vitest
```

---

## 🧪 Menjalankan Pengujian Otomatis (QA)

### 1. Pengecekan Tipe Statis (TypeScript)
Memastikan tidak ada kesalahan tipe data di seluruh modul:
```bash
npm run typecheck
```

### 2. Unit Testing (Vitest)
Menguji logika murni sistem senjata, amunisi, dan reload secara cepat di lingkungan Node:
```bash
npm run test:unit
```

### 3. Browser End-to-End Testing (Playwright)
Menguji jalannya aplikasi secara langsung di headless Chromium (memastikan menu tampil, game bisa dimulai, kanvas 3D siap, dan test hooks `window.__BLACK_VEIL__` berfungsi):

```bash
# Instal browser Chromium terlebih dahulu (cukup sekali saja)
npx playwright install chromium

# Jalankan pengujian E2E
npm run test:e2e
```

---

## 📦 Build Produksi & Deployment (GitHub Pages)

### Build Secara Lokal
Untuk menghasilkan bundel produksi yang teroptimasi di dalam folder `dist/`:
```bash
npm run build
```

Untuk mencoba hasil build produksi secara lokal:
```bash
npm run preview
```

### Deployment Otomatis via GitHub Actions
Proyek ini sudah dilengkapi file `.github/workflows/deploy.yml`. Untuk mengaktifkan deployment otomatis ke GitHub Pages:

1. Buka repositori kamu di GitHub.
2. Masuk ke menu **Settings > Pages**.
3. Pada bagian **Build and deployment > Source**, pilih **GitHub Actions**.
4. Lakukan git push ke branch `main`:
   ```bash
   git add .
   git commit -m "feat: complete Operation Black Veil FPS release"
   git push origin main
   ```

GitHub Actions akan otomatis menjalankan typecheck, unit test, build, Playwright E2E test, dan menerbitkan game ke URL GitHub Pages kamu.

---

## 📄 Lisensi & Sumber Aset

- **Kode Sumber**: Dirilis di bawah lisensi MIT.
- **Aset 3D & Tekstur**: Seluruh geometri level, senjata, model GLTF 2.0 tersemat (*Black-Box Core*), serta tekstur PBR dibuat secara prosedural menggunakan kode (`CanvasTexture` & skema GLTF standar) sehingga 100% bebas royalti dan legal.
- **Audio**: Seluruh efek suara dan ambience disintesis secara real-time menggunakan standar Web Audio API bawaan browser.
