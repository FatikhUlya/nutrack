# NUTRACK — Premium Nutrition & Fitness-Tech Tracker

**NUTRACK** adalah aplikasi pelacak nutrisi dan makanan harian tingkat lanjut dengan desain antarmuka modern bernuansa *dark mode* premium, perhitungan kebutuhan metabolisme berbasis sains (*Mifflin–St Jeor*), visualisasi analitik interaktif, serta scanner makanan berbasis kecerdasan buatan (*Google Gemini AI*).

---

## 🌟 Fitur Utama

### 1. Dashboard Pemantauan Harian (*Daily Tracker*)
- **Navigasi Tanggal Interaktif**: Navigasi ke hari sebelumnya, hari berikutnya, atau pilih tanggal spesifik melalui kalender dengan format bahasa Indonesia.
- **Hero Card Target & Energi**:
  - *Progress Ring* SVG dinamis dengan persentase ketercapaian dan status visual (*Sesuai Target*, *Sedang Berjalan*, *Melebihi Batas*).
  - Tampilan *Terkonsumsi*, *Target Harian*, dan *Sisa Kalori / Surplus*.
  - Rincian dasar metabolisme: BMR (*Basal Metabolic Rate*) dan TDEE (*Total Daily Energy Expenditure*).
- **Pemecahan Makronutrien (*Macro Breakdown*)**:
  - Kartu terpisah untuk **Protein** (2.0 g/kg), **Karbohidrat** (alokasi energi), dan **Lemak Sehat** (1.08 g/kg).
  - Indikator bar kemajuan, sisa gram, dan kontribusi energi (kcal).
- **Pencatatan Berdasarkan Waktu Makan**:
  - Pengelompokan: **Sarapan**, **Makan Siang**, **Makan Malam**, dan **Camilan**.
  - Subtotal kalori dan makronutrien per waktu makan.
  - Tag sumber catatan: *AI Scan* (dengan lencana khusus), *Tersimpan*, atau *Manual*.
  - Aksi cepat: Tambah makanan, Edit, dan Hapus.

### 2. AI Food Scanner (*Google Gemini Vision*)
- Unggah foto makanan dari kamera perangkat atau galeri (format JPG, PNG, WebP hingga 10MB).
- Deteksi segmentasi makanan otomatis melalui model vision Google Gemini.
- **Tinjauan Interaktif Sebelum Simpan**:
  - Setiap item yang terdeteksi menampilkan estimasi berat (gram), kalori, protein, karbohidrat, dan lemak.
  - Pengguna dapat mengedit nama, porsi, dan angka nutrisi sebelum disimpan ke buku harian.
  - Pilihan waktu makan untuk item yang dipindai.
- **Mode Demonstrasi Realistis**: Jika API key belum dipasang, scanner tetap dapat diuji secara interaktif dengan menu simulasi hidangan khas Indonesia.

### 3. Profil Pengguna & Kalkulator Nutrisi Ilmiah
- Input biometrik: Nama, Jenis Kelamin Biologis, Usia, Berat Badan (kg), Tinggi Badan (cm), Body Fat % (opsional).
- Pemilihan tingkat aktivitas:
  - *Sedentary* (×1.20)
  - *Light* (×1.375)
  - *Moderate* (×1.55)
  - *High* (×1.725)
  - *Very High* (×1.90)
- Pemilihan tujuan:
  - **Cut**: Defisit kalori moderat (-350 kcal)
  - **Maintenance**: Keseimbangan energi (0 kcal)
  - **Lean Bulk**: Surplus kalori konservatif (+200 kcal)
- **Live Preview Kalkulator**: Angka BMR, TDEE, Target Kalori, dan Makronutrien terhitung secara *real-time* saat form diisi, lengkap dengan peringatan batas aman kalori minimum (1.200 kcal).

### 4. Analisis Tren & Statistik (*Interactive Charts*)
- Periode analisis fleksibel: **7 Hari**, **14 Hari**, dan **30 Hari**.
- Ringkasan KPI: Rata-rata Kalori, Rata-rata Protein, Tingkat Kepatuhan Target (%), dan Hari Aktif Tercatat.
- **Grafik Batang Interaktif (Recharts)**: Asupan kalori harian dibandingkan garis referensi target.
- **Grafik Area Terdistribusi**: Komposisi harian gramatur Protein, Karbohidrat, dan Lemak.
- Tabel riwayat harian lengkap dengan navigasi langsung ke hari tersebut.

### 5. Manajemen Makanan Tersimpan (*Saved Foods*)
- Database makanan kustom tersimpan untuk pencatatan instan.
- Pencarian makanan cepat (*search filter*).
- Tambah, edit, dan hapus makanan tersimpan.
- Tombol satu klik: *"Catat ke Hari Ini"*.

---

## 📐 Formula dan Metodologi Nutrisi

1. **Basal Metabolic Rate (BMR) — Mifflin–St Jeor**:
   - Pria: $\text{BMR} = 10 \times \text{berat(kg)} + 6.25 \times \text{tinggi(cm)} - 5 \times \text{usia} + 5$
   - Wanita: $\text{BMR} = 10 \times \text{berat(kg)} + 6.25 \times \text{tinggi(cm)} - 5 \times \text{usia} - 161$

2. **Total Daily Energy Expenditure (TDEE)**:
   - $\text{TDEE} = \text{BMR} \times \text{Multiplier Aktivitas}$

3. **Target Kalori Harian**:
   - $\text{Target} = \text{TDEE} + \text{Penyesuaian Tujuan}$
   - *Batas aman minimum*: 1.200 kcal/hari.

4. **Alokasi Makronutrien**:
   - **Protein**: $2.0 \text{ g/kg berat badan}$ ($4 \text{ kcal/g}$)
   - **Lemak**: $1.08 \text{ g/kg berat badan}$ ($9 \text{ kcal/g}$)
   - **Karbohidrat**: Sisa kalori dibagi 4 $\left(\frac{\text{Target Kalori} - \text{Kalori Protein} - \text{Kalori Lemak}}{4}\right)$

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router, Server Components & Route Handlers)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) dengan palet warna HSL dark-mode kustom
- **Komponen Ikon**: [Lucide React](https://lucide.dev/)
- **Visualisasi Grafik**: [Recharts](https://recharts.org/)
- **Validasi Skema**: [Zod](https://zod.dev/)
- **Manipulasi Tanggal**: [date-fns](https://date-fns.org/) (dengan lokalisasi Bahasa Indonesia)
- **AI Vision Engine**: [@google/generative-ai](https://www.npmjs.com/package/@google/generative-ai) (Google Gemini Flash)
- **Testing**: [Jest](https://jestjs.io/) & [ts-jest](https://kulshekhar.github.io/ts-jest/)

---

## 🚀 Panduan Menjalankan Aplikasi

### 1. Prasyarat
- Node.js versi 18.17 atau lebih baru
- NPM / PNPM / Yarn

### 2. Instalasi Dependensi
```bash
npm install
```

### 3. Konfigurasi Lingkungan (`.env.local`)
Salin file `.env.example` ke `.env.local`:
```bash
cp .env.example .env.local
```

Isi konfigurasi pada file `.env.local`:
```env
# Google Gemini API Key (Opsional - jika kosong, sistem menggunakan demonstrasi simulasi)
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-1.5-flash

NEXT_PUBLIC_APP_NAME=NUTRACK
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_ENABLE_SCANNER=true
```

### 4. Menjalankan Server Pengembangan
```bash
npm run dev
```
Buka browser dan akses [http://localhost:3000](http://localhost:3000).

### 5. Menjalankan Pengujian Unit (*Unit Tests*)
```bash
npm test
```

---

## 📁 Struktur Direktori

```
c:\NUTRACK/
├── .env.example
├── .env.local
├── jest.config.ts
├── next.config.ts
├── package.json
├── tailwind.config.ts
├── tsconfig.json
├── src/
│   ├── app/
│   │   ├── api/scan-food/route.ts  # API route untuk analisis foto Gemini
│   │   ├── globals.css             # Desain token, reset & kelas utilitas
│   │   ├── layout.tsx              # Root layout & font Inter
│   │   ├── page.tsx                # Dashboard harian utama
│   │   ├── profile/page.tsx        # Halaman profil & kalkulator nutrisi
│   │   ├── saved/page.tsx          # Halaman koleksi makanan tersimpan
│   │   └── stats/page.tsx          # Halaman statistik tren Recharts
│   ├── components/
│   │   ├── dashboard/              # Komponen khusus dashboard
│   │   ├── food/                   # Modal form pencatatan makanan
│   │   ├── layout/                 # Navbar & Mobile BottomNav
│   │   ├── profile/                # Form biometrik & live preview target
│   │   ├── saved/                  # Manajemen makanan tersimpan
│   │   ├── scanner/                # Modal AI Food Scanner & review table
│   │   ├── stats/                  # Grafik tren & KPI analytics
│   │   └── ui/                     # Button, Input, Select, Card, Dialog, Toast, dll.
│   ├── hooks/                      # useFoodDiary, useProfile, useSavedFoods, useToast, dll.
│   ├── lib/
│   │   ├── ai/gemini.ts            # Modul integrasi server-side Gemini
│   │   ├── database/storage.ts     # Abstraksi layer penyimpanan typed
│   │   ├── database/seed.ts        # Seeder data awal & demo
│   │   ├── nutrition/calculator.ts # Formula ilmiah Mifflin-St Jeor & TDEE
│   │   ├── nutrition/calculator.test.ts # Unit test kalkulator nutrisi
│   │   ├── validation/schemas.ts   # Skema Zod
│   │   └── utils.ts                # Utilitas tanggal, angka, ID & styling
│   └── types/                      # Definisi tipe TypeScript
```

---

## 🔒 Privasi dan Keamanan Data
- Semua data pengguna disimpan di penyimpanan lokal browser (*localStorage*) dengan abstraksi antarmuka terisolasi, siap diintegrasikan dengan database eksternal (seperti Supabase atau PostgreSQL) tanpa mengubah kode UI.
- API Key Gemini tidak pernah diekspos ke sisi klien (*client-side*), melainkan diproses secara aman di *server-side route handler* (`/api/scan-food`).
