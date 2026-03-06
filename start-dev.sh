#!/bin/bash
# Start Fieldstone frontend dev server
# Ensures tailwindcss is properly installed before starting

bash "$(dirname "$0")/fix-tailwind.sh"

cd "$(dirname "$0")"
NODE_ENV=development npx next dev -H 0.0.0.0 -p 3000
