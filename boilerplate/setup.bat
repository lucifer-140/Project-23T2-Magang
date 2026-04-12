@echo off
REM ----------------------------------------------------------------------------
REM setup.bat -- one-shot dev environment initializer (Windows)
REM Run from the project root: setup.bat
REM ----------------------------------------------------------------------------

setlocal EnableDelayedExpansion

echo.
echo ============================================================
echo  Project Setup
echo ============================================================

REM --- 1. Check Node.js ---
echo.
echo [1/3] Checking Node.js...
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo  ERROR: Node.js not found.
    echo  Install v20+ from https://nodejs.org
    exit /b 1
)
for /f "tokens=*" %%v in ('node -v') do set NODE_VER=%%v
echo  Found Node !NODE_VER!

REM --- 2. Install dependencies ---
echo.
echo [2/3] Installing npm dependencies...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo  ERROR: npm install failed.
    exit /b 1
)

REM --- 3. Copy .env.example to .env ---
echo.
echo [3/3] Setting up environment file...
if exist ".env" (
    echo  WARNING: .env already exists -- skipping copy.
    echo  Edit it manually if needed.
) else (
    copy ".env.example" ".env" >nul
    echo  Created .env from .env.example
    echo  Open .env and update DATABASE_URL before starting the database.
)

REM --- 4. Generate Prisma client ---
echo.
echo [4/4] Generating Prisma client...
call npx prisma generate
if %ERRORLEVEL% NEQ 0 (
    echo  ERROR: Prisma generate failed. Check your schema.prisma.
    exit /b 1
)

REM --- Done ---
echo.
echo ============================================================
echo  Setup complete!
echo ============================================================
echo.
echo  Next steps:
echo    1. Edit .env with your DATABASE_URL
echo    2. docker compose up -d          ^(start Postgres^)
echo    3. npx prisma migrate dev        ^(apply schema^)
echo    4. npm run dev                   ^(start the app^)
echo.

endlocal
