FROM node:20-alpine

WORKDIR /app

# Copy package files first to leverage caching
COPY package*.json ./

# Install dependencies
RUN npm install
RUN npm install --save-dev @types/better-sqlite3

# Copy the rest of the source
COPY . .

# Compile TypeScript
RUN npm run build

EXPOSE 3003

# REMOVE DEV BY START WHEN PROJECT FINISH
CMD ["./init.sh"]
