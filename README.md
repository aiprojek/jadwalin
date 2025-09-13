# Jadwalin - Generator Jadwal Sekolah Cerdas

Jadwalin adalah aplikasi web progresif (PWA) yang dirancang untuk penggunaan _offline-first_. Tujuan utamanya adalah untuk menyederhanakan tugas kompleks dalam membuat jadwal pelajaran dan ujian di sekolah, dengan secara otomatis menangani berbagai batasan seperti ketersediaan guru, alokasi ruangan, jam pelajaran, dan persyaratan mata pelajaran.

Aplikasi ini bersifat _client-side_, artinya semua data (guru, kelas, jadwal, dll.) disimpan dengan aman di perangkat pengguna, memastikan privasi dan kecepatan akses tanpa ketergantungan pada koneksi internet setelah aplikasi dimuat pertama kali.

---

## Disclaimer: Kolaborasi AI & Manusia

Aplikasi ini adalah hasil dari sebuah eksperimen kolaboratif yang unik antara kecerdasan buatan (AI) dan manusia.

-   **Peran AI (Senior Frontend Engineer)**: Bertanggung jawab untuk menulis sebagian besar kode, merancang arsitektur komponen, mengimplementasikan fitur berdasarkan _prompt_, dan memastikan kualitas serta performa UI/UX. AI bertindak sebagai pengembang utama.
-   **Peran Manusia (AI Projek)**: Bertindak sebagai _project manager_, konseptor, dan _quality assurance_. Manusia memberikan ide awal, arahan pengembangan melalui _prompt_ yang detail, melakukan pengujian, serta memandu visi dan tujuan akhir dari aplikasi.

Kolaborasi ini menunjukkan bagaimana AI dapat menjadi alat yang kuat untuk mempercepat proses pengembangan perangkat lunak, sementara kreativitas dan arahan strategis dari manusia tetap menjadi kunci keberhasilan proyek.

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

## Panduan Pengguna

Berikut adalah alur kerja yang direkomendasikan untuk menggunakan Jadwalin secara efektif.

### Langkah 1: Manajemen Data

Ini adalah fondasi dari jadwal Anda. Kualitas jadwal sangat bergantung pada keakuratan data yang Anda masukkan. Buka tab **Manajemen Data**.

1.  **Jenjang Pendidikan**: Tambahkan semua jenjang yang ada di sekolah Anda (misal: SMP, SMA). Atur hari libur dan slot waktu (jam pelajaran & istirahat) untuk masing-masing jenjang.
2.  **Mata Pelajaran**: Masukkan semua mata pelajaran dan kaitkan dengan jenjang yang sesuai.
3.  **Ruangan**: Definisikan semua ruangan yang tersedia, termasuk laboratorium atau ruangan khusus lainnya.
4.  **Guru**: Daftarkan semua guru, lalu atur hari ketersediaan mereka, jenjang tempat mereka mengajar, dan mata pelajaran yang mereka kuasai.
5.  **Kelas**: Terakhir, buat semua kelas, kaitkan dengan jenjangnya, dan definisikan mata pelajaran yang diambil oleh kelas tersebut, lengkap dengan alokasi jam per minggu dan guru pengajarnya.

### Langkah 2: Pembuatan Jadwal

Setelah semua data lengkap, buka tab **Generator Jadwal**.

1.  Pilih **Jenis Jadwal** (Reguler atau Ujian).
2.  Pilih **Jenjang Pendidikan** yang ingin dibuatkan jadwalnya, atau gunakan tombol **Buat Jadwal Semua Jenjang** untuk proses gabungan.
3.  Klik **Buat Jadwal**. Algoritma akan bekerja untuk menyusun jadwal terbaik berdasarkan batasan yang ada.
4.  Jika diperlukan, Anda bisa membuat beberapa **Varian** untuk membandingkan hasil yang berbeda.

### Langkah 3: Interaksi dan Penyempurnaan

Jadwal yang dihasilkan dapat disesuaikan:

-   **Drag & Drop**: Pindahkan sesi pelajaran ke slot waktu yang berbeda. Sistem akan memberikan peringatan jika terjadi konflik.
-   **Cari Pengganti**: Klik pada sebuah sesi pelajaran untuk membuka fitur pencarian guru pengganti yang memenuhi syarat.
-   **Ubah Tampilan**: Gunakan kontrol tampilan untuk melihat jadwal berdasarkan kelas, guru, atau ruangan. Anda juga bisa beralih ke **Tabel Induk** untuk melihat gambaran besar.

### Langkah 4: Arsip dan Ekspor

Setelah jadwal dirasa final, klik **Simpan Varian ini ke Arsip**.

-   Di tab **Arsip Jadwal**, Anda dapat melihat semua jadwal yang telah disimpan.
-   Dari sini, Anda bisa **Mencetak**, **Mengekspor ke HTML**, atau **Mengekspor ke CSV** untuk dibagikan atau diolah lebih lanjut.

### Langkah 5: Pengaturan Aplikasi

Di menu **Pengaturan**, Anda bisa:

-   Mengatur **Informasi Lembaga** untuk ditampilkan di kop surat.
-   Mengonfigurasi **Tahun Ajaran**.
-   Menyesuaikan **Pengaturan Cetak** seperti ukuran kertas dan margin.
-   Melakukan **Backup & Restore** seluruh data aplikasi. **Sangat disarankan untuk melakukan backup secara berkala!**

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
-   `README.md`: Dokumentasi proyek ini.

---

## ❤️ Dukungan & Komunitas

Aplikasi ini tersedia secara gratis, apa adanya, _open-source_, dan terbuka untuk kolaborasi. Jika Anda merasa aplikasi ini bermanfaat, Anda bisa memberikan dukungan melalui beberapa cara:

-   ☕ **[Donasi](https://lynk.id/aiprojek/s/bvBJvdA)**
-   ⭐ **Memberi Bintang di GitHub**: Jika Anda menyukai proyek ini, berikan bintang ⭐ pada [repositori GitHub](https://github.com/aiprojek/jadwalin).
-   💬 **Bergabung dengan Diskusi**: Punya pertanyaan, ide, atau ingin berbagi pengalaman? Gabung dengan [grup diskusi di Telegram](https://t.me/aiprojek_community/32).

---

## Kontribusi

Kontribusi dari komunitas sangat kami hargai! Jika Anda ingin berkontribusi, berikut adalah beberapa cara yang bisa Anda lakukan:

-   **Melaporkan Bug**: Temukan masalah? Buka _issue_ baru di [halaman Issues GitHub](https://github.com/aiprojek/jadwalin/issues).
-   **Mengusulkan Fitur**: Punya ide untuk fitur baru? Sampaikan melalui _issue_ dengan label `enhancement`.
-   **Mengirimkan Pull Request**: Jika Anda ingin memperbaiki bug atau menambahkan fitur, silakan buat _pull request_. Untuk perubahan besar, disarankan untuk membuka _issue_ terlebih dahulu untuk diskusi.

Setiap bentuk kontribusi akan membantu Jadwalin menjadi lebih baik.

---

## Lisensi

Proyek ini dilisensikan di bawah **GNU General Public License v3.0**.
