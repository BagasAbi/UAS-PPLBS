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
npm start
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

*(Instruksi untuk layanan ini belum dibuat)*

---

## Cara Berkontribusi ke GitHub

Setelah Anda membuat repositori baru di situs GitHub, ikuti langkah-langkah ini untuk mengirim kode Anda.

1.  **Inisialisasi Git (jika belum):**
    ```bash
    git init
    ```

2.  **Tambahkan semua file ke Git:**
    ```bash
    git add .
    ```

3.  **Buat commit pertama Anda:**
    ```bash
    git commit -m "Initial commit: Setup project structure and services"
    ```

4.  **Hubungkan repositori lokal Anda dengan repositori di GitHub:**
    *(Ganti `URL_REPO_ANDA` dengan URL repositori GitHub yang telah Anda buat)*
    ```bash
    git remote add origin URL_REPO_ANDA
    ```

5.  **Ganti nama branch utama menjadi `main` (jika perlu):**
    ```bash
    git branch -M main
    ```

6.  **Push kode Anda ke GitHub:**
    ```bash
    git push -u origin main
    ```

Setelah itu, teman Anda dapat melakukan `git clone URL_REPO_ANDA` untuk mengunduh proyek dan mulai berkontribusi.
