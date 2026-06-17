@echo off
:: Tento skript vytvori KOMPLETNU zalohu databazy (Strukturu aj samotne data)

echo ===========================================
echo ZALOHOVANIE DATABAZY SPORTWELL
echo ===========================================

:: 1. Nastavte si sem CELY Connection String (nezabudnite Session pooler a realne heslo!)
set DB_URL="postgresql://postgres.pjzhoqussygulucpexlt:SportWellKlinika2026@aws-1-eu-central-2.pooler.supabase.com:5432/postgres"

:: 2. Nastavte si cestu k Vasmu Google Drive (upravte podla potreby)
:: Priklad: C:\Users\mstancik\Google Drive\Zalohy
set TARGET_DIR=C:\Zalohy_Databaza
if not exist "%TARGET_DIR%" mkdir "%TARGET_DIR%"

for /f "tokens=2-4 delims=/ " %%a in ('date /t') do (set mydate=%%c-%%b-%%a)

echo.
echo KROK 1: Stahujem strukturu databazy (tabulky, pravidla)...
set SCHEMA_FILE=%TARGET_DIR%\%mydate%_struktura.sql
call npx supabase db dump --db-url "%DB_URL%" --file "%SCHEMA_FILE%"

echo.
echo KROK 2: Stahujem realne data klientov...
set DATA_FILE=%TARGET_DIR%\%mydate%_data.sql
call npx supabase db dump --db-url "%DB_URL%" --data-only --file "%DATA_FILE%"

echo ===========================================
echo ZALOHA JE HOTOVA!
echo Ulozene v: %TARGET_DIR%
pause
