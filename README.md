# Panduan Menjalankan dan Menguji AI-Inventory-System

Dokumen ini berisi langkah-langkah detail untuk menjalankan dan menguji proyek Anda secara lokal.

## 1. Status Proyek vs Persyaratan

Berdasarkan analisis struktur folder, proyek Anda **SANGAT SESUAI** dengan ketentuaan tugas akhir PPLBS:
- **SOA/Microservices**: Terpisah menjadi Gateway, Product, Sales, Stock, dan Prediction service.
- **AI Integration**: Ada `prediction-service` dengan Python/Flask.
- **REST API**: Menggunakan Express.js dan Flask.
- **Frontend**: Menggunakan Vite/React di `frontend-dashboard`.
- **Database**: Menggunakan Supabase (cloud based).

**Rekomendasi:** Tes semua fitur di **lokal (localhost)** terlebih dahulu untuk memastikan logika bisnis berjalan lancar sebelum masuk ke tahap deployment dengan Docker/Kubernetes.

---

## 2. Persiapan Lingkungan (Environment Variables)

Sebelum menjalankan, pastikan setiap service memiliki file `.env` dengan kredensial Supabase Anda.

> [!IMPORTANT]
> Anda perlu mendapatkan `SUPABASE_URL` dan `SUPABASE_KEY` dari dashboard Supabase proyek Anda.

Buat file `.env` di setiap folder service berikut:

### a. `product-service/.env`
```env
PORT=3001
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
```

### b. `sales-service/.env`
```env
PORT=4000
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
STOCK_SERVICE_URL=http://localhost:3002
```

### c. `stock-service/.env`
```env
PORT=3002
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
```

### d. `prediction-service/.env`
```env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
```

### e. `gateaway-service/.env`
```env
PORT=8000
FRONTEND_URL=http://localhost:5173
PRODUCT_SERVICE_URL=http://localhost:3001
SALES_SERVICE_URL=http://localhost:4000
STOCK_SERVICE_URL=http://localhost:3002
PREDICTION_SERVICE_URL=http://localhost:5000
```

---

## 3. Langkah-Langkah Menjalankan (Local Port)

Anda perlu membuka **6 Terminal** yang berbeda (satu untuk setiap service).

### Terminal 1: Gateway Service
```bash
cd "c:\semester 7\service\UAS\AI-Inventory-System\gateaway-service"
npm install
node server.js
```
*Berjalan di: `http://localhost:8000`*

### Terminal 2: Prediction Service (AI)
```bash
cd "c:\semester 7\service\UAS\AI-Inventory-System\prediction-service"
# Buat venv jika belum ada
python -m venv venv
# Windows:
venv\Scripts\activate
pip install -r requirements.txt
python app.py
```
*Berjalan di: `http://localhost:5000`*

### Terminal 3: Product Service
```bash
cd "c:\semester 7\service\UAS\AI-Inventory-System\product-service"
npm install
node server.js
```
*Berjalan di: `http://localhost:3001`*

### Terminal 4: Sales Service
```bash
cd "c:\semester 7\service\UAS\AI-Inventory-System\sales-service"
npm install
npm start
```
*Berjalan di: `http://localhost:4000`*

### Terminal 5: Stock Service
```bash
cd "c:\semester 7\service\UAS\AI-Inventory-System\stock-service"
npm install
npm start
```
*Berjalan di: `http://localhost:3002`*

### Terminal 6: Frontend Dashboard
```bash
cd "c:\semester 7\service\UAS\AI-Inventory-System\frontend-dashboard"
npm install
npm run dev
```
*Berjalan di: `http://localhost:5173`*

---

## 4. Cara Pengujian (Testing)

### A. Testing via Browser (Manual Test UI)
1. Buka browser (Chrome/Edge).
2. Kunjungi: `http://localhost:5173`.
3. Coba fitur-fitur yang ada di dashboard, seperti melihat stok, melakukan transaksi penjualan, atau melihat prediksi.
4. Pastikan Frontend berhasil mengambil data. Jika error, cek console browser (F12) dan terminal Gateway Service.

### B. Testing via Postman (Integration Test)
Gunakan URL Gateway (`http://localhost:8000`) sebagai pintu masuk. Jangan tembak service langsung kecuali debugging.

**Contoh Request:**

1.  **Cek Prediksi (AI Service)**
    *   **Method**: `POST`
    *   **URL**: `http://localhost:8000/api/predict`
    *   **Body (JSON)**:
        ```json
        {
          "product_line": "Health and beauty"
        }
        ```

2.  **Cek Produk (Product Service)**
    *   **Method**: `GET`
    *   **URL**: `http://localhost:8000/api/products`

3.  **Cek Stok (Stock Service)**
    *   **Method**: `GET`
    *   **URL**: `http://localhost:8000/api/stock`

4.  **Input Penjualan (Sales Service)**
    *   **Method**: `POST`
    *   **URL**: `http://localhost:8000/api/sales/transaction`
    *   **Body (JSON)**:
        ```json
        {
          "product_name": "Contoh Produk",
          "quantity": 5,
          "sales_person": "Budi"
        }
        ```

Selamat mencoba! Jika semua berjalan lancar di lokal, Anda bisa mencoba fitur advanced berikut yang sudah saya siapkan:

---

## 5. Menjalankan dengan Docker (Simplifikasi)

Daripada membuka 6 terminal, Anda bisa menjalankan **semua service** dengan SATU perintah.

### Prasyarat:
- Docker Desktop sudah terinstal dan berjalan.

### Langkah-langkah:
1. Buka terminal di folder root project: `c:\semester 7\service\UAS\AI-Inventory-System`
2. Jalankan perintah:
   ```bash
   docker-compose up --build
   ```
3. Tunggu hingga semua container berjalan.
4. Akses Frontend di `http://localhost:5173`.
5. Service lain berjalan di dalam container dan saling terhubung secara otomatis.

> **Catatan**: Jika menggunakan Docker, semua `SERVICE_URL` di env akan otomatis menggunakan nama service (misal `http://stock-service:3002`), bukan `localhost`. Ini sudah diatur otomatis di `docker-compose.yml`.

---

## 6. Akses Dokumentasi API (Swagger)

Gateway Service kini memiliki dokumentasi API interaktif.

1. Pastikan Gateway Service berjalan (baik via Terminal atau Docker).
2. Buka browser: `http://localhost:8000/api-docs`
3. Anda akan melihat daftar lengkap endpoint API untuk Authentication, Products, Sales, Stock, dan Prediction.
4. Anda bisa test hit API langsung dari halaman tersebut!

---

## 7. Kubernetes / K8s (Advanced / Bonus)

Folder `k8s/` telah disesuaikan dengan standar tugas kuliah (menggunakan `NodePort` dan `ConfigMap`).

### Langkah-langkah (Local via Minikube):

1.  **Start Minikube**:
    ```bash
    minikube start
    ```

2.  **Point Shell ke Minikube Docker Env** (PENTING! Agar minikube bisa baca image docker kita):
    *   **PowerShell**: `minikube -p minikube docker-env --shell powershell | Invoke-Expression`
    *   **CMD**: `@FOR /f "tokens=*" %i IN ('minikube -p minikube docker-env --shell cmd') DO @%i`

3.  **Build Image di dalam Minikube**:
    (Anda harus build ulang image agar masuk ke registry Minikube)
    ```bash
    docker-compose build
    ```

4.  **Siapkan Konfigurasi**:
    *   Edit `k8s/secrets.yaml` (isi kredensial Supabase Anda).
    *   Apply config:
        ```bash
        kubectl apply -f k8s/configmap.yaml
        kubectl apply -f k8s/secrets.yaml
        ```

5.  **Deploy Aplikasi**:
    ```bash
    kubectl apply -f k8s/
    ```

6.  **Akses Aplikasi**:
    Karena menggunakan `NodePort`, aplikasi bisa diakses di IP Minikube port 30001 (Gateway) dan 30002 (Frontend).
    ```bash
    minikube service frontend-dashboard --url
    minikube service gateway-service --url
    ```
    Atau buka langsung di browser: `http://localhost:30002` (jika menggunakan Docker Driver/Tunneling).
