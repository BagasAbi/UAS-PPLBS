# Stock Service

Layanan ini mengelola data stok barang, mencatat pergerakan stok, serta memperbarui `current_stock` pada tabel `products` di Supabase.

## Menjalankan Service

```bash
cd stock-service
npm install
# cp .env.example .env
npm start
```

Service berjalan di: http://localhost:3002

## Docker

```bash
docker build -t stock-service .
docker stop stock-service || true
docker rm stock-service || true
docker run -d --name stock-service -p 3002:3002 --env-file .env stock-service
```

## Environment Variables

```
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=SERVICE_ROLE_KEY_ANDA
PORT=3002
```

## Endpoint

### POST /stock/move
Mencatat pergerakan stok.

### GET /stock/:product_id
Mengambil stok terkini.

### GET /stock/:product_id/movements
Histori pergerakan stok.

## Struktur Folder

```
stock-service/
├── src/
├── Dockerfile
├── .dockerignore
└── package.json
```
