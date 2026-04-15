#!/bin/bash

# Action Item App Startup Script
cd "$(dirname "$0")"
export PATH="$PWD/node/bin:$PATH"
echo "Starting Action Item App..."
echo "The app will be available at: http://localhost:5173/"
npm run dev
