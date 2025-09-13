# Jadwalin - Generator Jadwal Sekolah Cerdas

Jadwalin adalah aplikasi web progresif (PWA) yang cerdas dan dirancang untuk penggunaan _offline-first_ pada perangkat mobile. Tujuan utamanya adalah untuk menyederhanakan tugas kompleks dalam membuat jadwal pelajaran dan ujian di sekolah, dengan secara otomatis menangani berbagai batasan seperti ketersediaan guru, alokasi ruangan, jam pelajaran, dan persyaratan mata pelajaran.

Aplikasi ini bersifat _client-side_, artinya semua data (guru, kelas, jadwal, dll.) disimpan dengan aman di perangkat pengguna, memastikan privasi dan kecepatan akses tanpa ketergantungan pada koneksi internet setelah aplikasi dimuat pertama kali.

---

## Kisah Pengembangan: Sebuah Kolaborasi

Perjalanan aplikasi Jadwalin ini adalah contoh nyata dari kolaborasi antara Anda (pengguna) dan saya (asisten AI). Berikut adalah rekam jejak pengembangan kita:

### Fase 1: Fondasi Awal dan Identifikasi Masalah

Anda datang dengan sebuah fondasi kode yang solid untuk aplikasi Jadwalin. Namun, Anda menemukan sebuah masalah kritis: **"kenapa tombol tambah di setiap bagian manajemen data jadi tidak berfungsi?"**. Tombol "Tambah" untuk Jenjang, Guru, Mata Pelajaran, dan lainnya tidak merespons, yang menghambat fungsionalitas inti aplikasi.

Peran saya pada tahap ini adalah sebagai seorang _debugger_ dan _engineer_. Setelah menganalisis file yang Anda berikan, saya mengidentifikasi bahwa file `App.tsx` tidak lengkap dan terpotong. Hal ini menyebabkan logika penting, terutama yang bertanggung jawab untuk menampilkan _modal_ (jendela pop-up) untuk menambah data, tidak ada. Kontribusi pertama saya adalah **memperbaiki dan melengkapi file `App.tsx`**, mengembalikan semua fungsionalitas yang hilang dan membuat tombol-tombol tersebut berfungsi kembali.

### Fase 2: Panduan Menuju _Deployment_

Setelah aplikasi kembali berfungsi, Anda mengajukan pertanyaan berikutnya: **"tanpa merubah file dan struktur yang ada. jelaskan kepadau cara deploy file ini secara local dan di cloudflare"**. Anda ingin tahu cara agar aplikasi ini bisa diakses, baik untuk pengujian di komputer lokal maupun untuk publikasi global melalui Cloudflare.

Peran saya berkembang menjadi seorang _DevOps engineer_ dan mentor. Saya menjelaskan bahwa meskipun struktur proyek sudah modern, browser tidak bisa langsung membaca kode `.tsx`. Saya memberikan solusi praktis tanpa mengubah struktur proyek:

1.  **Mengompilasi Kode**: Saya memberikan perintah `esbuild` untuk mengubah `index.tsx` menjadi file `index.js` standar yang bisa dibaca semua browser.
2.  **Panduan _Deployment_ Lokal**: Saya menyediakan beberapa opsi mudah untuk menjalankan aplikasi di komputer lokal menggunakan VS Code Live Server, `npx serve`, dan server HTTP Python.
3.  **Panduan _Deployment_ Cloudflare**: Saya memberikan dua metode komprehensif untuk _deployment_ di Cloudflare Pages: metode _drag-and-drop_ yang cepat dan metode integrasi Git yang profesional dan otomatis, lengkap dengan konfigurasi _build command_ yang diperlukan.

### Fase 3: Dokumentasi Proyek (Tahap Saat Ini)

Sebagai langkah akhir dalam siklus pengembangan ini, Anda meminta: **"buat file readme berisi penjelasan aplikasi ini dari awal hingga akhir termasuk keterlibatanmu dan aku dalam pengembangan aplikasi ini"**.

Kini, peran saya adalah sebagai seorang _technical writer_. Saya menyusun file `README.md` ini untuk mendokumentasikan proyek secara menyeluruh, merangkum tujuan aplikasi, fitur-fiturnya, teknologi yang digunakan, dan yang terpenting, menceritakan kembali kisah kolaborasi kita dalam membangun dan menyempurnakan Jadwalin.

---

## Fitur Utama

-   **Manajemen Data Komprehensif**: Mengelola data inti sekolah seperti Jenjang, Guru, Mata Pelajaran, Ruangan, dan Kelas dengan antarmuka yang intuitif.
-   **Generator Jadwal Cerdas**: Membuat jadwal Reguler dan Ujian secara otomatis berdasarkan batasan yang telah ditentukan, dengan kemampuan menangani potensi konflik.
-   **Penjadwalan Gabungan**: Kemampuan untuk membuat satu jadwal besar yang mencakup semua jenjang pendidikan sekaligus.
-   **Editor Jadwal Interaktif**: Jadwal yang dihasilkan tidak kaku. Pengguna bisa melakukan penyesuaian dengan fitur _drag & drop_ dan validasi konflik secara _real-time_.
-   **Pencarian Guru Pengganti**: Fitur cerdas untuk menemukan kandidat guru pengganti yang memenuhi syarat (bisa mengajar mapel, tersedia pada hari itu, dan tidak sedang mengajar di kelas lain).
-   **Dasbor Analitik**: Memberikan wawasan visual mengenai beban mengajar guru, distribusi mata pelajaran, utilisasi ruangan, dan kepadatan jadwal melalui grafik dan _heatmap_.
-   **Arsip Jadwal**: Menyimpan versi-versi jadwal yang sudah final. Dari arsip, jadwal dapat dicetak atau diekspor ke format HTML dan CSV.
-   **Fungsionalitas PWA (_Offline-First_)**: Aplikasi dapat di-install di perangkat dan berfungsi penuh tanpa koneksi internet setelah dimuat pertama kali.
-   **Kustomisasi Tampilan & Pengaturan**: Mendukung tema terang & gelap, multi-bahasa (Indonesia & Inggris), serta pengaturan kop surat dan margin untuk keperluan cetak.
-   **Backup & Restore Data**: Mengamankan semua data aplikasi dengan satu klik dan memulihkannya kapan saja, memastikan data tidak hilang.

---

## Teknologi yang Digunakan

-   **Frontend**: React, TypeScript, JSX
-   **Styling**: Tailwind CSS
-   **Ikon**: Bootstrap Icons
-   **Grafik & Dasbor**: Chart.js
-   **Drag & Drop**: @dnd-kit
-   **Kompilasi (untuk _Deployment_)**: esbuild
-   **PWA**: Service Worker API

---

## Cara Menjalankan Secara Lokal

Untuk menjalankan aplikasi ini di komputer Anda, ikuti langkah-langkah berikut:

1.  **Prasyarat**: Pastikan Anda sudah meng-install [Node.js](https://nodejs.org/).

2.  **Kompilasi Kode**: Buka terminal di direktori proyek dan jalankan perintah berikut untuk mengubah file `.tsx` menjadi `.js` yang dapat dibaca browser:
    ```bash
    npx esbuild index.tsx --bundle --outfile=index.js --jsx=automatic
    ```

3.  **Update Referensi Script**: Buka file `index.html` dan ubah baris paling bawah dari:
    ```html
    <script type="module" src="/index.tsx"></script>
    ```
    menjadi:
    ```html
    <script type="module" src="/index.js"></script>
    ```

4.  **Jalankan Server Lokal**: Di terminal, jalankan salah satu perintah berikut:
    ```bash
    # Menggunakan serve (rekomendasi)
    npx serve
    ```
    Buka browser dan akses alamat yang ditampilkan (biasanya `http://localhost:3000`).

---

## Struktur Proyek

-   `index.html`: Titik masuk utama aplikasi web.
-   `index.tsx`: File yang me-render komponen utama React ke dalam DOM.
-   `App.tsx`: Komponen inti yang berisi semua logika aplikasi, UI, dan manajemen state.
-   `types.ts`: Mendefinisikan semua struktur data dan tipe TypeScript yang digunakan di seluruh aplikasi.
-   `service-worker.js`: Mengaktifkan kapabilitas PWA dan fungsionalitas offline.
-   `manifest.json`: Konfigurasi untuk Progressive Web App.
-   `services/`: Direktori yang berisi modul-modul pembantu.
    -   `localScheduler.ts`: Algoritma _backtracking_ untuk pembuatan jadwal secara lokal.
    -   `exportStyles.ts`: Menyediakan style CSS untuk keperluan cetak dan ekspor.
