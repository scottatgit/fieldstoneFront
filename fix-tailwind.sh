#!/bin/bash
# Fix: ensure tailwindcss is properly installed
# npm sometimes fails to hoist tailwindcss — this script re-extracts it
TW_DIR="$(dirname "$0")/node_modules/tailwindcss"
PREFLIGHT="$TW_DIR/lib/css/preflight.css"

if [ ! -f "$PREFLIGHT" ]; then
  echo "[fix-tailwind] tailwindcss missing, extracting from npm cache..."
  cd "$(dirname "$0")"
  npm pack tailwindcss@3.4.12 --pack-destination /tmp/tw_fix 2>/dev/null
  mkdir -p /tmp/tw_fix/extract
  tar -xzf /tmp/tw_fix/tailwindcss-3.4.12.tgz -C /tmp/tw_fix/extract 2>/dev/null
  rm -rf "$TW_DIR"
  cp -r /tmp/tw_fix/extract/package "$TW_DIR"
  echo "[fix-tailwind] ✅ tailwindcss restored"
else
  echo "[fix-tailwind] ✅ tailwindcss OK"
fi
