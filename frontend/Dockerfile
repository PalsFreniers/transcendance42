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

# Expose frontend port
EXPOSE 5173
EXPOSE 3004

# REMOVE DEV BY START WHEN PROJECT FINISH
CMD ["npm", "run", "dev"] 