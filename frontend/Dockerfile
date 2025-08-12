# Use Node.js with Debian base
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy dependency declarations
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm install

# Copy app source
COPY . .

# Build TypeScript
RUN npm run build-all

# Expose frontend port
EXPOSE 5173

# Run the compiled JS
CMD ["node", "public/scripts/index.js"]
