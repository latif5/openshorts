#!/bin/sh
set -e
cd /app
exec npm run dev -- --host 0.0.0.0 --port "${PORT:-5173}"
