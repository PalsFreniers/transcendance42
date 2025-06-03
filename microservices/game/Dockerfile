FROM node:20-alpine

# Create the directory of the API (Microservice)
WORKDIR /src

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Build TS
RUN npm run build

# Expose port
EXPOSE 3002

#Start user services
CMD ["npm", "run", "Start"]