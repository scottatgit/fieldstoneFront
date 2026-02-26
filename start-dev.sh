#!/bin/bash
# Start Next.js dev server
# NODE_ENV must be overridden to 'development' because the container
# runs with NODE_ENV=production which breaks PostCSS/Tailwind in dev mode
cd "$(dirname "$0")"
echo '[Next.js] Starting with NODE_ENV=development override...'
env NODE_ENV=development npx next dev -H 0.0.0.0 -p 3000
