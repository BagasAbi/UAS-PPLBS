# Gateway Service (gateaway-service)

Panduan singkat menjalankan dan menguji `gateaway-service`.

Prereq:
- Node.js terinstal
- Pastikan `SUPABASE_URL` dan `SUPABASE_SERVICE_KEY` serta `BACKEND_JWT_SECRET` ada di file `.env` pada folder `gateaway-service`.

1) Menjalankan server
```powershell
cd "c:\semester 7\service\UAS\AI-Inventory-System\gateaway-service"
npm install
npm start
```
Server default berjalan pada `http://localhost:8000`.

2) Environment yang penting (example `.env`):
```
SUPABASE_URL=https://xyz.supabase.co
SUPABASE_SERVICE_KEY=eyJ... (service role key)
BACKEND_JWT_SECRET=rahasia_dev_anda
# Optional untuk seeder admin
NEW_ADMIN_EMAIL=admin@toko.com
NEW_ADMIN_PASSWORD=admin123
NEW_ADMIN_NAME=Pemilik
```

3) Membuat admin (local/seeder)
```powershell
npm run create-admin
```
Perintah ini akan membuat user baru di tabel `user` dengan `role = 'admin'`.

4) Endpoint penting
- `POST /register` — Daftar user baru (default `role: 'user'`). Body: `{ email, password, name }`.
- `POST /login` — Login, body: `{ email, password }`. Mengembalikan JWT.
- `POST /auth/google` — Login via Google ID token.
- `PATCH /users/:id/role` — Ubah role (HANYA `admin`). Header: `Authorization: Bearer <token_admin>`. Body: `{ role: 'owner'|'staff'|'user'|'admin' }`.
- Proxy ke service lain (via gateway):
  - `GET /api/products` -> product-service
  - `GET /api/stock` -> stock-service
  - dll (lihat `src/middleware/proxy.js` untuk daftar lengkap)

5) Cara uji cepat (Postman / curl)
- Register:
```powershell
curl -X POST http://localhost:8000/register -H "Content-Type: application/json" -d '{"email":"user@example.com","password":"secret123","name":"Nama User"}'
```
- Login:
```powershell
curl -X POST http://localhost:8000/login -H "Content-Type: application/json" -d '{"email":"user@example.com","password":"secret123"}'
```
- Ubah role (admin):
```powershell
curl -X PATCH http://localhost:8000/users/<user-id>/role -H "Content-Type: application/json" -H "Authorization: Bearer <admin-token>" -d '{"role":"owner"}'
```

6) Catatan keamanan
- Jangan membuat token JWT manual untuk production. Gunakan `/login` dan seeder admin hanya untuk development.
- Pastikan `BACKEND_JWT_SECRET` tidak bocor.
- Endpoint admin dibatasi oleh role-check dan rate-limiter.

Jika mau, saya bisa menambahkan koleksi Postman (sudah saya tambahkan di `postman/`) dan instruksi lebih rinci.
