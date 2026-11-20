@echo off
title ZGlowra E-Commerce System
cd /d "%~dp0"
echo =====================================================================
echo                ZGLOWRA - BODY CARE E-COMMERCE
echo =====================================================================

if not exist "server\node_modules\" (
    echo [SETUP] Menginstall dependencies server...
    call npm --prefix server install
    echo [SETUP] Menyiapkan database dan data produk...
    call npm --prefix server run migrate
    call npm --prefix server run seed
)

if not exist "client\node_modules\" (
    echo [SETUP] Menginstall dependencies client...
    call npm --prefix client install
)

if not exist "node_modules\" (
    echo [SETUP] Menginstall dependencies root...
    call npm install
)

echo [INFO] Menjalankan Server Backend (Port 5000) dan Client (Port 5173)...
echo [INFO] Tekan CTRL+C untuk menghentikan aplikasi.
echo =====================================================================
npm run dev
