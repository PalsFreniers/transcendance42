#!/bin/sh

echo "📦 Initializing Node project for Tournament..."

# Create package.json
cat <<EOF > package.json
{
  "name": "tournament",
  "version": "1.0.0",
  "description": "tournament microservice for Transcendence",
  "main": "src/index.ts",
  "scripts": {
    "dev": "ts-node-dev --respawn src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "fastify": "^4.22.2",
    "dotenv": "^16.4.5"
  },
  "devDependencies": {
    "typescript": "^5.4.5",
    "ts-node-dev": "^2.0.0"
  }
}
EOF

echo "📁 Installing dependencies..."
npm install

echo "🛠️ Installing dev dependencies..."
npm install --save-dev typescript ts-node-dev

echo "📄 Creating tsconfig.json..."
npx tsc --init --rootDir src --outDir dist --module commonjs --target es2020 --esModuleInterop

echo "✅ Tournament setup complete!"
