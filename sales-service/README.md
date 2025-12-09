# Sales Service

Backend service untuk **penyimpanan data penjualan** dan **agregasi time-series** (siap untuk ML).

## Overview

- **POST /sales** – Membuat record penjualan baru (transaksi)
- **GET /sales** – Mengambil riwayat penjualan (opsional filter berdasarkan `product_id`)
- **GET /sales/aggregate?product_id=...&window=7d** – Data time-series untuk ML forecasting
- **POST /scripts/import_kaggle.py** – Import data CSV dari Kaggle

## Project Structure

```
sales-service/
├── src/
│   ├── index.js                 # Express server entrypoint
│   ├── supabaseClient.js        # Supabase initialization
│   ├── routes/
│   │   └── salesRoutes.js       # Route handlers
│   └── services/
│       └── salesService.js      # Business logic (CRUD, aggregation)
├── scripts/
│   ├── import_kaggle.py         # Python script to import CSV
│   └── requirements.txt         # Python dependencies
├── package.json
├── .env.example
├── .gitignore
└── README.md (this file)
```

## Setup

### Node.js Backend

1. **Install dependencies (dependencies):**
   ```bash
   npm install
   ```

2. **Set up environment variables (salin dari `.env.example`):**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` dan isi:
   - `SUPABASE_URL` – URL project Supabase lu
   - `SUPABASE_KEY` – Public/Service key Supabase
   - `STOCK_SERVICE_URL` (opsional) – URL Stock Service (contoh: `http://localhost:3002`) untuk notifikasi saat ada penjualan
   - `PORT` (opsional, default `3003`)

3. **Jalankan server:**
   ```bash
   npm start
   ```

### Python Import Script

1. **Install Python dependencies:**
   ```bash
   cd scripts
   pip install -r requirements.txt
   ```

2. **Download dataset Kaggle** (kalau belum ada)

3. **Jalankan import:**
   ```bash
   python scripts/import_kaggle.py /path/to/supermarket_sales.csv
   ```

## Endpoints

### POST /sales

Membuat record penjualan baru (transaksi).

**Request Body:**
```json
{
  "product_id": 1,
  "quantity_sold": 5,
  "sales_person": "John Doe"
}
```

**Response (201 Created):**
```json
{
  "id": 123,
  "product_id": 1,
  "quantity_sold": 5,
  "transaction_date": "2025-12-08T10:30:00Z",
  "sales_person": "John Doe"
}
```

**Catatan:**
- `product_id` dan `quantity_sold` adalah required.
- Kalau `transaction_date` tidak diberikan, akan pakai timestamp sekarang.
- Kalau `STOCK_SERVICE_URL` dikonfigurasi, endpoint ini otomatis notify Stock Service untuk kurangin stock (via `POST /stock/move`).

### GET /sales

Mengambil semua atau filter data penjualan.

**Query Parameters:**
- `product_id` (opsional) – Filter berdasarkan product ID

**Contoh:**
```
GET /sales?product_id=1
```

**Response (200 OK):**
```json
[
  {
    "id": 123,
    "product_id": 1,
    "quantity_sold": 5,
    "transaction_date": "2025-12-08T10:30:00Z",
    "sales_person": "John Doe"
  }
]
```

### GET /sales/aggregate

Mengambil data time-series agregasi penjualan untuk ML forecasting.

**Query Parameters:**
- `product_id` (required) – Product ID
- `window` (opsional, default `7d`) – Time window (contoh: `7d`, `30d`, `14d`)

**Contoh:**
```
GET /sales/aggregate?product_id=1&window=7d
```

**Response (200 OK):**
```json
{
  "product_id": 1,
  "window": "7d",
  "series": [
    { "date": "2025-12-01", "quantity_sold": 10 },
    { "date": "2025-12-02", "quantity_sold": 15 },
    ...
    { "date": "2025-12-08", "quantity_sold": 20 }
  ]
}
```

**Catatan:**
- Agregasi total quantity sold per hari.
- Isi hari yang kosong dengan `0`.

## Database Schema

### Tabel `transactions` (Sudah Ada)

Digunakan untuk menyimpan record penjualan (transaksi).

```sql
CREATE TABLE public.transactions (
  id integer NOT NULL DEFAULT nextval('transactions_id_seq'::regclass),
  product_id integer,
  quantity_sold integer NOT NULL,
  transaction_date timestamp without time zone DEFAULT now(),
  sales_person character varying,
  CONSTRAINT transactions_pkey PRIMARY KEY (id),
  CONSTRAINT transactions_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id)
);
```

### Tabel `supermarket_sales` (Sudah Ada)

Digunakan untuk import data Kaggle.

```sql
CREATE TABLE public.supermarket_sales (
  "Invoice ID" text NOT NULL UNIQUE,
  "Branch" text,
  "City" text,
  "Customer type" text,
  "Gender" text,
  "product_line" text,
  "Unit price" double precision,
  "quantity" bigint,
  "Tax 5%" double precision,
  "Sales" double precision,
  "date" text,
  "Time" text,
  "Payment" text,
  "cogs" double precision,
  "gross margin percentage" double precision,
  "gross income" double precision,
  "Rating" double precision,
  CONSTRAINT supermarket_sales_pkey PRIMARY KEY ("Invoice ID")
);
```

### Tabel Terkait

Tabel `products` dan `stock_movements` sudah ada dan dipakai oleh Stock Service, jadi **tidak perlu buat tabel baru**.

## Testing dengan Postman atau curl

### Test POST /sales

```bash
curl -X POST http://localhost:3003/sales \
  -H "Content-Type: application/json" \
  -d '{
    "product_id": 1,
    "quantity_sold": 5,
    "sales_person": "Alice"
  }'
```

### Test GET /sales

```bash
curl http://localhost:3003/sales
```

### Test GET /sales/aggregate

```bash
curl http://localhost:3003/sales/aggregate?product_id=1&window=7d
```

## Integrasi dengan Service Lain

- **Stock Service**: Kalau `STOCK_SERVICE_URL` diset, membuat penjualan otomatis notify Stock Service untuk kurangin stok via `POST /stock/move`. Lihat `src/services/salesService.js` untuk detail implementasi.
- **ML Forecasting Service**: Gunakan `GET /sales/aggregate` untuk fetch historical sales data untuk time-series prediction.
