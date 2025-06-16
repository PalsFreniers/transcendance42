FROM node:20-alpine

WORKDIR /src

# Copy package files first to leverage caching
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the source
COPY . .

# Compile TypeScript
RUN npx tsc

# Start the service
CMD ["node", "js/index.js"]
