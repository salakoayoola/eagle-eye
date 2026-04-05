#!/usr/bin/env bash
set -euo pipefail

echo "=== Eagle Eye Installer ==="
echo ""

# Check Docker
if ! command -v docker &>/dev/null; then
  echo "Error: Docker is not installed."
  echo "Install Docker: https://docs.docker.com/get-docker/"
  exit 1
fi

if ! docker compose version &>/dev/null; then
  echo "Error: Docker Compose is not available."
  echo "Install Docker Compose: https://docs.docker.com/compose/install/"
  exit 1
fi

# Create .env if it doesn't exist
if [ ! -f .env ]; then
  cp .env.example .env
  echo "Created .env from .env.example"
  echo "Edit .env to configure your data directory and ports."
  echo ""
fi

# Create data directory
DATA_DIR=$(grep -E "^DATA_DIR=" .env 2>/dev/null | cut -d= -f2 || echo "./data")
DATA_DIR=${DATA_DIR:-./data}
mkdir -p "$DATA_DIR"
echo "Data directory: $DATA_DIR"

# Check for drive management
ENABLE_DRIVES=""
if [[ "$(uname)" == "Linux" ]]; then
  echo ""
  read -p "Enable drive management (mount/eject removable storage)? [y/N] " -n 1 -r
  echo ""
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    ENABLE_DRIVES="--profile drives"
  fi
fi

# Build and start
echo ""
echo "Building and starting Eagle Eye..."
docker compose $ENABLE_DRIVES up -d --build

EAGLE_EYE_PORT=$(grep -E "^EAGLE_EYE_PORT=" .env 2>/dev/null | cut -d= -f2 || echo "8080")
EAGLE_EYE_PORT=${EAGLE_EYE_PORT:-8080}

echo ""
echo "=== Eagle Eye is running! ==="
echo "Open http://localhost:${EAGLE_EYE_PORT} in your browser"
echo ""
echo "Commands:"
echo "  docker compose logs -f        # View logs"
echo "  docker compose down            # Stop"
echo "  docker compose up -d           # Start"
