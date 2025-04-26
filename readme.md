
# Point of Sales System

Sistem ini terdiri dari tiga komponen utama:
1. **Product API** - Backend untuk mengelola produk.
2. **Order API** - Backend untuk mengelola pesanan.
3. **Frontend** - Antarmuka pengguna untuk mengelola produk dan pesanan.

## Persyaratan Sistem
Pastikan Anda telah menginstal perangkat lunak berikut:
- [PHP](https://www.php.net/downloads) (minimal versi 8.0) dengan ekstensi:
  - `pdo`
  - `mbstring`
  - `openssl`
- [Composer](https://getcomposer.org/download/)
- [Node.js](https://nodejs.org/) (minimal versi 16.x)
- [npm](https://www.npmjs.com/get-npm)
- [MySQL](https://dev.mysql.com/downloads/) (minimal versi 8.0) atau [PostgreSQL](https://www.postgresql.org/download/) (minimal versi 13.x)
- Browser modern (misalnya Chrome atau Firefox)

## Langkah Instalasi

### 1. Clone Repository
Clone repository ini ke komputer Anda:
```bash
git clone <repository-url>
cd PointOfSales
```

### 2. Setup Product API
1. Masuk ke direktori `product-api`:
   ```bash
   cd product-api
   ```
2. Install dependensi PHP menggunakan Composer:
   ```bash
   composer install
   ```
3. Salin file `.env.example` menjadi `.env`:
   ```bash
   cp .env.example .env
   ```
4. Generate application key:
   ```bash
   php artisan key:generate
   ```
5. Jalankan migrasi database:
   ```bash
   php artisan migrate
   ```
6. Jalankan server:
   ```bash
   php artisan serve --port=8000
   ```

### 3. Setup Order API
1. Masuk ke direktori `order-api`:
   ```bash
   cd ../order-api
   ```
2. Install dependensi PHP menggunakan Composer:
   ```bash
   composer install
   ```
3. Salin file `.env.example` menjadi `.env`:
   ```bash
   cp .env.example .env
   ```
4. Generate application key:
   ```bash
   php artisan key:generate
   ```
5. Jalankan migrasi database:
   ```bash
   php artisan migrate
   ```
6. Jalankan server:
   ```bash
   php artisan serve --port=8001
   ```

### 4. Setup Frontend
1. Masuk ke direktori `frontend`:
   ```bash
   cd ../frontend
   ```
2. Install dependensi Node.js menggunakan npm:
   ```bash
   npm install
   ```
3. Jalankan aplikasi frontend:
   ```bash
   npm start
   ```

## Cara Menggunakan
1. Pastikan **Product API** berjalan di `http://localhost:8000`.
2. Pastikan **Order API** berjalan di `http://localhost:8001`.
3. Buka **Frontend** di browser Anda (biasanya berjalan di `http://localhost:3000`).

## Struktur Proyek
- `product-api/` - Backend untuk produk.
- `order-api/` - Backend untuk pesanan.
- `frontend/` - Antarmuka pengguna.

## Catatan
- Pastikan database sudah dikonfigurasi dengan benar di file `.env` untuk `product-api` dan `order-api`.
- Jika Anda mengalami masalah, periksa log error di terminal atau file log aplikasi.

Selamat menggunakan!
```
