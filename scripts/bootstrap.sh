#!/usr/bin/env sh
set -eu

if [ ! -f .env ]; then
  cp .env.example .env
  echo "Created .env. Add OPENROUTER_API_KEY before AI processing."
fi

npm install
npm run bootstrap

echo "Bootstrap complete. Run web with 'npm run dev' and the scheduler in another terminal with 'npm run worker'."
