# HPP Backend

Backend API untuk manajemen **HPP (Harga Pokok Produksi)** — bahan baku, produk, transaksi keuangan, dan dashboard analitik.

Dibangun dengan **NestJS**, **Prisma**, dan **MySQL/MariaDB**. Dilengkapi dokumentasi **Swagger** untuk testing API.

---

## Tech Stack

| Teknologi       | Kegunaan                  |
| --------------- | ------------------------- |
| NestJS 11       | Framework backend         |
| Prisma 7        | ORM & migrasi database    |
| MySQL / MariaDB | Database                  |
| Swagger         | Dokumentasi & testing API |
| bcrypt          | Hash password user        |
| Multer          | Upload gambar produk      |

---

## Fitur

### User

- Login dengan username & password (bcrypt)
- Response login berisi `id` user yang dipakai sebagai Bearer token di endpoint lain

### Raw Material (Bahan Baku)

- CRUD bahan baku (nama, satuan, stok, harga rata-rata, reorder point)
- Log inventory otomatis saat stok awal dibuat (`IN_INITIAL`)

### Product (Produk)

- CRUD produk dengan upload gambar (`multipart/form-data`)
- Komposisi bahan baku per produk (ingredients)
- Perhitungan otomatis **costPrice** (HPP sebelum margin) dan **sellingPrice** (harga jual setelah margin)
- **Product Price Log** — riwayat perubahan harga (create, update, recalc dari pembelian bahan baku)
- Margin: `fixedMargin` (prioritas) atau `marginPercent`

### Transaction (Transaksi)

#### Pembelian Bahan Baku — `EXPENSE` + `RAW_MATERIAL_PURCHASE`

- `totalAmount` dihitung server dari `unitPrice × quantity`
- Stok & `averagePrice` bahan baku terupdate (weighted average)
- Inventory log tercatat (`IN_PURCHASE`)
- Harga produk terkait otomatis di-recalculate

#### Penjualan Produk — `INCOME` + `SALE`

- `totalAmount` dari input user (mendukung diskon/negotiation)
- `unitPrice` item diisi otomatis dari `sellingPrice` produk saat transaksi
- Stok produk berkurang
- Stok bahan baku berkurang sesuai komposisi produk (gagal jika stok bahan baku tidak cukup)
- Inventory log bahan baku tercatat (`OUT_SALE`)

#### Lainnya

- Daftar transaksi dengan pagination (`GET /api/transaction?page=1&limit=20`)

### Dashboard

Satu endpoint mengembalikan:

- Ringkasan: total pemasukan, total pengeluaran, keuntungan, saldo (min 0)
- Pemasukan & pengeluaran per bulan per tahun
- Saldo per bulan per tahun (min 0)
- Top 10 produk paling banyak ditransaksikan

Filter opsional: `?year=2026`

---

## Prasyarat

- [Node.js](https://nodejs.org/) v18+
- [npm](https://www.npmjs.com/)
- MySQL atau MariaDB

---

## Instalasi

### 1. Clone & install dependency

```bash
git clone <repository-url>
cd hpp_backend
npm install
```

### 2. Konfigurasi environment

Salin file contoh environment:

```bash
cp .env.example .env
```

Sesuaikan isi `.env`:

```env
PORT=3000
DATABASE_URL="mysql://root:password@localhost:3306/db"
DATABASE_HOST="localhost"
DATABASE_PORT=3306
DATABASE_USER="root"
DATABASE_PASSWORD="password"
DATABASE_NAME="db"
```

### 3. Setup database

Buat database di MySQL/MariaDB, lalu sinkronkan schema:

```bash
npx prisma db push
npx prisma generate
```

### 4. Seed user default

```bash
npm run seed
```

User default:

| Field    | Value    |
| -------- | -------- |
| Username | `admin`  |
| Password | `123456` |
| Name     | Admin    |

### 5. Jalankan aplikasi

```bash
# Development (hot reload)
npm run start:dev

# Production
npm run build
npm run start:prod
```

Aplikasi berjalan di: **http://localhost:3000**

---

## Dokumentasi API (Swagger)

Buka: **http://localhost:3000/docs**

### Autentikasi

1. Login di **User → POST /api/user/login**
2. Salin `data.id` dari response
3. Klik **Authorize** di Swagger, masukkan User ID tersebut
4. Semua endpoint terproteksi siap digunakan

### Format response

**Sukses:**

```json
{
  "success": true,
  "message": "...",
  "data": { ... }
}
```

**Error:**

```json
{
  "success": false,
  "message": "Pesan error",
  "error": "Bad Request"
}
```

---

## Ringkasan Endpoint

| Modul        | Method           | Endpoint                      | Keterangan              |
| ------------ | ---------------- | ----------------------------- | ----------------------- |
| User         | POST             | `/api/user/login`             | Login                   |
| Raw Material | GET/POST         | `/api/raw-material`           | List / buat             |
| Raw Material | GET/PATCH/DELETE | `/api/raw-material/:id`       | Detail / update / hapus |
| Product      | POST             | `/api/product`                | Buat (multipart)        |
| Product      | GET              | `/api/product`                | List semua              |
| Product      | GET              | `/api/product/:id`            | Detail                  |
| Product      | GET              | `/api/product/:id/price-logs` | Riwayat harga           |
| Product      | PATCH/DELETE     | `/api/product/:id`            | Update / hapus          |
| Transaction  | GET              | `/api/transaction`            | List (paginated)        |
| Transaction  | POST             | `/api/transaction`            | Buat transaksi          |
| Dashboard    | GET              | `/api/dashboard`              | Data dashboard          |
| Dashboard    | GET              | `/api/dashboard?year=2026`    | Filter per tahun        |

---

## Struktur Folder

```
src/
├── common/           # Guard, filter, decorator, helper bersama
├── dashboard/        # Modul dashboard keuangan
├── generated/prisma/ # Prisma client (auto-generated)
├── prisma/           # Prisma service
├── product/          # Modul produk & pricing
├── raw-material/     # Modul bahan baku
├── transaction/      # Modul transaksi
├── user/             # Modul autentikasi
└── main.ts           # Entry point + Swagger setup

prisma/
├── schema.prisma     # Database schema
└── seed.ts           # Seeder user default

public/
└── uploads/products/ # Gambar produk yang diupload
```

---

## Scripts

| Perintah              | Keterangan                             |
| --------------------- | -------------------------------------- |
| `npm run start:dev`   | Jalankan development dengan hot reload |
| `npm run build`       | Build production                       |
| `npm run start:prod`  | Jalankan build production              |
| `npm run seed`        | Seed user default                      |
| `npx prisma db push`  | Sinkronkan schema ke database          |
| `npx prisma generate` | Generate Prisma client                 |
| `npm run lint`        | Lint & fix kode                        |
| `npm run test`        | Unit test                              |

---

## Alur Bisnis Singkat

```
1. Login → dapat User ID (Bearer token)
2. Buat Raw Material (bahan baku)
3. Buat Product + ingredients → costPrice & sellingPrice dihitung otomatis
4. Transaksi pembelian bahan baku → stok naik, harga rata-rata update, harga produk recalc
5. Transaksi penjualan → stok produk & bahan baku turun, inventory log tercatat
6. Dashboard → pantau pemasukan, pengeluaran, saldo, produk terlaris
```

---

## Lisensi

UNLICENSED — Private project.
