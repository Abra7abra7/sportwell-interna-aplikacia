@echo off
:: Tento skript vytvori KOMPLETNU zalohu databazy (Strukturu aj samotne data)
:: a automaticky ju zasifruje pomocou 7-Zip s AES-256

echo ===========================================
echo ZALOHOVANIE A SIFROVANIE DATABAZY SPORTWELL
echo ===========================================

:: 1. Nastavte si sem CELY Connection String (nezabudnite Session pooler a realne heslo!)
set DB_URL="postgresql://postgres.pjzhoqussygulucpexlt:SportWellKlinika2026@aws-1-eu-central-2.pooler.supabase.com:5432/postgres"

:: 2. Nastavte si cestu k Vasmu Google Drive (upravte podla potreby)
set TARGET_DIR=C:\Zalohy_Databaza
if not exist "%TARGET_DIR%" mkdir "%TARGET_DIR%"

:: Ziskanie presneho datumu a casu (bez bodiek a medzier)
for /f %%I in ('powershell -Command "Get-Date -Format 'yyyy-MM-dd_HH-mm-ss'"') do set mydate=%%I

echo.
echo KROK 1: Stahujem strukturu databazy (tabulky, pravidla)...
set SCHEMA_FILE=%TARGET_DIR%\%mydate%_struktura.sql
call npx supabase db dump --db-url "%DB_URL%" --file "%SCHEMA_FILE%"

echo.
echo KROK 2: Stahujem realne data klientov...
set DATA_FILE=%TARGET_DIR%\%mydate%_data.sql
call npx supabase db dump --db-url "%DB_URL%" --data-only --file "%DATA_FILE%"

echo.
echo KROK 3: Sifrujem data vojenskym standardom (AES-256)...
set ZIP_FILE=%TARGET_DIR%\%mydate%_Zaloha.zip
call 7z a -tzip -p"SportWell2026" -mem=AES256 "%ZIP_FILE%" "%SCHEMA_FILE%" "%DATA_FILE%"

echo.
echo KROK 4: Upratujem nezasifrovane subory...
del "%SCHEMA_FILE%"
del "%DATA_FILE%"

echo ===========================================
echo ZALOHA JE HOTOVA A BEZPECNE ZASIFROVANA!
echo Ulozene v: %ZIP_FILE%
pause
