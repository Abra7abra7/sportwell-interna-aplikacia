@echo off
echo =========================================
echo Vytvaranie databazy pre novu kliniku
echo =========================================

echo 1. Najdite "Connection String" STAREJ databazy (so zaškrtnutým "Session pooler").
set /p OLD_DB_URL="Vlozte cely Connection String STAREJ databazy: "

echo.
echo 2. Vlozte IBA ID noveho projektu (tie pismena z adresy, napr. ggxlhdxujydimyykfyer)
set /p NEW_PROJECT_ID="Zadajte ID noveho projektu: "

echo.
echo KROK 1: Stahujem kompletnu strukturu zo starej databazy...
call npx supabase db dump --db-url "%OLD_DB_URL%" --file kopia_struktury.sql

echo.
echo KROK 2: Pripajam sa k novemu projektu (cez API, nepotrebujeme heslo k databaze!)...
call npx supabase link --project-ref %NEW_PROJECT_ID%

echo.
echo KROK 3: Nahravam strukturu do novej databazy...
call npx supabase db query --linked --file kopia_struktury.sql

echo.
echo Upratujem (mazem docasny SQL subor)...
del kopia_struktury.sql

echo =========================================
echo Hotovo! Nova databaza je identicka s tou povodnou.
pause
