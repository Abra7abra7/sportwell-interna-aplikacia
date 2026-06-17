@echo off
:: Tento skript vytvori SQL zalohu celej Vasej produkcnej databazy

echo Poznamka: Supabase nedavno presiel na nove adresy (IPv6 / Pooler). 
echo Najdite svoj "Connection String" priamo v Supabase:
echo Project Settings -^> Database -^> Connection String (Nezabudnite tam vlozit heslo)
echo Vlozte tento cely retazec sem do skriptu:

:: 1. Nastavte si sem CELY Connection String k vasej databaze zo Supabase
set DB_URL="VLOZTE_CELY_CONNECTION_STRING_SEM"

:: 2. Nastavte si zlozku, kam sa ma zaloha ulozit
set TARGET_DIR=C:\Zalohy_Databaza
if not exist "%TARGET_DIR%" mkdir "%TARGET_DIR%"

for /f "tokens=2-4 delims=/ " %%a in ('date /t') do (set mydate=%%c-%%b-%%a)
set DUMP_FILE=%TARGET_DIR%\Zaloha_%mydate%.sql

echo Zacinam stahovanie databazy. Toto moze chvilu trvat...
call npx supabase db dump --db-url "%DB_URL%" --file "%DUMP_FILE%"

echo Databaza bola uspesne ulozena do %DUMP_FILE%
pause
