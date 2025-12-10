# Panduan Menjalankan dan Menguji AI-Inventory-System

Dokumen ini berisi langkah-langkah detail untuk menjalankan dan menguji proyek Anda secara lokal.

## 1. Status Proyek vs Persyaratan

Berdasarkan analisis struktur folder, proyek Anda **SANGAT SESUAI** dengan ketentuaan tugas akhir PPLBS:
- **SOA/Microservices**: Terpisah menjadi Gateway, Product, Sales, Stock, Prevention, dan Restock service.
- **AI Integration**: Ada `prediction-service` V2 dengan Python/FastAPI (Random Forest).
- **REST API**: Menggunakan Express.js dan Flask/FastAPI.
- **Frontend**: Menggunakan Vite/React di `frontend-dashboard` dengan UI yang sudah diindonesiakan.
- **Database**: Menggunakan Supabase (cloud based) sebagai Single Source of Truth.
- **Role-Based Access**: Mendukung peran User, Staff, dan Manager.

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

### e. `restock-service/.env`
(Optional, jika dibutuhkan kedepannya)

### f. `gateaway-service/.env`
```env
PORT=8000
FRONTEND_URL=http://localhost:5173
PRODUCT_SERVICE_URL=http://localhost:3001
SALES_SERVICE_URL=http://localhost:4000
STOCK_SERVICE_URL=http://localhost:3002
PREDICTION_SERVICE_URL=http://localhost:5000
RESTOCK_SERVICE_URL=http://localhost:6000
```

---

## 3. Langkah-Langkah Menjalankan (Local Port)

Anda perlu membuka **7 Terminal** yang berbeda (satu untuk setiap service).

### Terminal 1: Gateway Service
```bash
cd "c:\semester 7\service\UAS\AI-Inventory-System\gateaway-service"
npm install
node server.js
```
*Berjalan di: `http://localhost:8000`*

### Terminal 2: Prediction Service (AI V2)
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

### Terminal 6: Restock Service
```bash
cd "c:\semester 7\service\UAS\AI-Inventory-System\restock-service"
# Gunakan venv yang sama atau buat baru
pip install -r requirements.txt
python app.py
```
*Berjalan di: `http://localhost:6000`*

### Terminal 7: Frontend Dashboard
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
3. **Login sesuai Role**:
   - **User**: Hanya melihat Data Produk.
   - **Staff**: Bisa melihat Data Produk + Panel "Kelola Stok" (Penjualan).
   - **Manager**: Akses Penuh (Data Produk, Kelola Stok (Jual/Restock), Analisis AI + Eksekusi Order).
4. Coba fitur **"Kelola Stok"** untuk menambah (Restock) atau mengurangi (Penjualan) stok.
5. Coba fitur **"Analisis AI"** (Manager only) dengan memasukkan ID Produk. Jika rekomendasi muncul, klik **"Eksekusi Order"**.

### B. Testing via Postman (Integration Test)
Gunakan URL Gateway (`http://localhost:8000`) sebagai pintu masuk.

**Contoh Request:**

1.  **Cek Prediksi (AI Service V2)**
    *   **Method**: `POST`
    *   **URL**: `http://localhost:8000/api/predict`
    *   **Body (JSON)**:
        ```json
        {
          "product_id": 1
        }
        ```

2.  **Cek Produk (Product Service)**
    *   **Method**: `GET`
    *   **URL**: `http://localhost:8000/api/products`

3.  **Cek Keputusan Restock (Restock Service)**
    *   **Method**: `POST`
    *   **URL**: `http://localhost:8000/api/restock`
    *   **Body**:
        ```json
        {
            "product_id": 1,
            "current_stock": 10,
            "predicted_demand": 50
        }
        ```

4.  **Update Stok Manual (Stock Service)**
    *   **Method**: `POST`
    *   **URL**: `http://localhost:8000/api/stock/move`
    *   **Body**:
        ```json
        {
            "product_id": 1,
            "qty_change": 10,
            "reason": "Manual Restock"
        }
        ```

Selamat mencoba!

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

> **Catatan**: Jika menggunakan Docker, semua `SERVICE_URL` di env akan otomatis menggunakan nama service (misal `http://stock-service:3002`), bukan `localhost`. Ini sudah diatur otomatis di `docker-compose.yml`. Anda akan memiliki **7 Container** berjalan.

---

## 6. Akses Dokumentasi API (Swagger)

Gateway Service kini memiliki dokumentasi API interaktif.

1. Pastikan Gateway Service berjalan (baik via Terminal atau Docker).
2. Buka browser: `http://localhost:8000/api-docs`
3. Anda akan melihat daftar lengkap endpoint API untuk Authentication, Products, Sales, Stock, dan Prediction.
4. Anda bisa test hit API langsung dari halaman tersebut!

---

## 7. Deployment dengan Kubernetes (Docker Desktop)

Bagian ini adalah panduan lengkap deployment menggunakan **Kubernetes bawaan Docker Desktop**.

### A. Prasyarat
1.  **Docker Desktop** terinstal.
2.  Enable Kubernetes di: `Settings` -> `Kubernetes` -> `Enable Kubernetes`.
3.  Tunggu hingga indikator hijau: "Kubernetes Running".

### B. Langkah Deployment
*Jalankan perintah ini di PowerShell sebagai Administrator di folder project.*

1.  **Build Image**:
    ```powershell
    docker-compose build
    ```
    *(Penting agar K8s mengenali image lokal Anda)*

2.  **Setup Config & Secret**:
    ```powershell
    kubectl apply -f k8s/configmap.yaml
    kubectl apply -f k8s/secrets.yaml
    ```

3.  **Deploy Aplikasi**:
    ```powershell
    kubectl apply -f k8s/
    ```

4.  **Cek Status**:
    ```powershell
    kubectl get pods
    ```
    *Tunggu hingga semua status `Running`.*

### C. Akses Aplikasi
- **Frontend**: http://localhost:30002
- **Gateway**: http://localhost:30001

### D. Uji Coba Self-Healing (Backup Otomatis)
Kubernetes akan otomatis menghidupkan server yang mati.
(bisa juga kalo di docker langsung tinggal matiin terus otomatis ada server baru)
1.  Cek Pod: `kubectl get pods` (Lihat nama pod stock-service).
2.  Matikan Paksa: `kubectl delete pod stock-service-xxxx`
3.  Cek Lagi: `kubectl get pods`
4.  **Hasil**: Pod lama hilang, pod baru langsung muncul otomatis.

### E. Cara Update Codingan (Tanpa Matikan Server)
Jika Anda mengubah kode:
1.  `docker-compose build`
2.  `kubectl rollout restart deployment`

### F. Uninstall / Stop
`kubectl delete -f k8s/`
