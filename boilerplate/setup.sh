#!/usr/bin/env bash
# -----------------------------------------------------------------------------
# setup.sh — one-shot dev environment initializer (macOS / Linux)
# Run: chmod +x setup.sh && ./setup.sh
# -----------------------------------------------------------------------------

set -e  # Exit immediately on any error

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

step() { echo -e "\n${GREEN}▶ $1${NC}"; }
warn() { echo -e "${YELLOW}⚠  $1${NC}"; }
fail() { echo -e "${RED}✗  $1${NC}"; exit 1; }

# --- 1. Check Node.js ---
step "Checking Node.js..."
if ! command -v node &>/dev/null; then
  fail "Node.js not found. Install v20+ from https://nodejs.org"
fi
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
  warn "Node.js v${NODE_VERSION} detected. v20+ is recommended."
fi
echo "  Node $(node -v) / npm $(npm -v)"

# --- 2. Install dependencies ---
step "Installing npm dependencies..."
npm install

# --- 3. Copy .env.example → .env ---
step "Setting up environment file..."
if [ -f ".env" ]; then
  warn ".env already exists — skipping copy. Edit it manually if needed."
else
  cp .env.example .env
  echo "  Created .env from .env.example"
  echo "  ➜  Open .env and update DATABASE_URL before starting the database."
fi

# --- 4. Generate Prisma client ---
step "Generating Prisma client..."
npx prisma generate

# --- Done ---
echo -e "\n${GREEN}✔ Setup complete!${NC}"
echo ""
echo "Next steps:"
echo "  1. Edit .env with your DATABASE_URL"
echo "  2. docker compose up -d          # start Postgres"
echo "  3. npx prisma migrate dev        # apply schema"
echo "  4. npm run dev                   # start the app"
echo ""
