FROM node:20-alpine

# Create the directory of the API
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY ..

# Build TS
RUN npm run build

# Expose port
EXPOSE 3001

#Start user services
CMD ["node", "dist/index.js"]