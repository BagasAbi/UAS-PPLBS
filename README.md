# AI-Inventory-System

Sistem inventaris cerdas yang memanfaatkan AI untuk prediksi permintaan stok.

## Arsitektur

Proyek ini menggunakan arsitektur microservices, yang terdiri dari beberapa layanan:

- **Gateway Service:** Titik masuk tunggal untuk semua permintaan dari klien.
- **Prediction Service:** Memberikan prediksi permintaan produk menggunakan model AI.
- **Product Service:** Mengelola data produk.
- **Sales Service:** Mengelola data penjualan.
- **Stock Service:** Mengelola data stok barang.

## Prasyarat

Pastikan Anda telah menginstal perangkat lunak berikut:

- [Node.js](https://nodejs.org/) (untuk layanan berbasis Node.js)
- [Python](https://www.python.org/) (untuk layanan prediksi)

## Instalasi & Menjalankan

Berikut adalah cara untuk menginstal dependensi dan menjalankan setiap layanan.

### 1. Gateway Service

```bash
# Masuk ke direktori layanan
cd gateaway-service

# Instal dependensi
npm install

# Jalankan server
node server.js
```

### 2. Prediction Service

```bash
# Masuk ke direktori layanan
cd prediction-service

# (Disarankan) Buat dan aktifkan virtual environment
python -m venv venv
source venv/bin/activate  # Untuk Windows gunakan `venv\Scripts\activate`

# Instal dependensi dari requirements.txt (jika ada)
# Catatan: Saat ini file requirements.txt belum ada. Anda perlu membuatnya.
# pip freeze > requirements.txt
pip install -r requirements.txt

# Salin file .env.example menjadi .env dan sesuaikan isinya jika ada
# cp .env.example .env

# Jalankan aplikasi
python app.py
```

### 3. Product Service

*(Instruksi untuk layanan ini belum dibuat)*

### 4. Sales Service

*(Instruksi untuk layanan ini belum dibuat)*

### 5. Stock Service

```bash
# Masuk ke direktori layanan
cd stock-service

# Instal dependensi Node.js
npm install

# (Opsional) Salin file .env.example menjadi .env lalu sesuaikan nilainya
# cp .env.example .env
# Untuk Windows (PowerShell):
# copy .env.example .env

# Jalankan aplikasi
npm start
```

Service akan berjalan pada:

```
http://localhost:3002
```

Jika ingin menjalankan menggunakan Docker:

```bash
docker build -t stock-service .
docker stop stock-service || true
docker rm stock-service || true
docker run -d --name stock-service -p 3002:3002 --env-file .env stock-service
```

## Berkontribusi

Kami sangat menyambut kontribusi dari komunitas! Jika Anda ingin membantu mengembangkan AI-Inventory-System, silakan ikuti panduan berikut:

1.  **Fork Repositori:** Buat *fork* dari repositori ini ke akun GitHub Anda.
2.  **Buat Branch Baru:** Buat *branch* baru untuk fitur atau perbaikan yang sedang Anda kerjakan.
    ```bash
    git checkout -b nama-fitur-anda
    ```
3.  **Lakukan Perubahan:** Buat perubahan atau penambahan kode Anda. Pastikan untuk mengikuti gaya kode yang sudah ada.
4.  **Commit Perubahan:** Commit perubahan Anda dengan pesan yang jelas dan deskriptif.
    ```bash
    git commit -m "feat: Menambahkan fitur X yang luar biasa"
    ```
5.  **Push ke Branch:** Push perubahan Anda ke *branch* di repositori *fork* Anda.
    ```bash
    git push origin nama-fitur-anda
    ```
6.  **Buat Pull Request:** Buka repositori utama di GitHub dan buat *Pull Request* (PR) dari *branch* Anda. Jelaskan perubahan yang Anda buat dan mengapa perubahan itu diperlukan.

Tim kami akan meninjau PR Anda sesegera mungkin. Terima kasih telah berkontribusi!

---
