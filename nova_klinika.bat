@echo off
echo =========================================
echo Vytvaranie databazy pre novu kliniku
echo =========================================
echo TENTO SKRIPT PREKOPIRUJE KOMPLETNU STRUKTURU ZO STAREHO PROJEKTU DO NOVEHO
echo.
echo Poznamka: Supabase nedavno presiel na nove adresy (IPv6 / Pooler). 
echo Najdite svoj "Connection String" priamo v Supabase:
echo Project Settings -^> Database -^> Connection String (Nezabudnite tam vlozit heslo)
echo.

set /p OLD_DB_URL="Vlozte cely Connection String STAREJ databazy: "
set /p NEW_DB_URL="Vlozte cely Connection String NOVEJ databazy: "

echo.
echo KROK 1: Stahujem kompletnu strukturu zo starej databazy...
call npx supabase db dump --db-url "%OLD_DB_URL%" --file kopia_struktury.sql

echo.
echo KROK 2: Nahravam strukturu do novej databazy...
call npx supabase db query --db-url "%NEW_DB_URL%" --file kopia_struktury.sql

echo.
echo Upratujem (mazem docasny SQL subor)...
del kopia_struktury.sql

echo =========================================
echo Hotovo! Nova databaza je identicka s tou povodnou.
pause
