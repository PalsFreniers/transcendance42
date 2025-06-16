FROM node:20-alpine

WORKDIR /src

# Copy only package files first (for better layer caching)
COPY package*.json ./

# Install all dependencies (fastify, etc.)
RUN npm install

# Now copy rest of your source code
COPY . .

# Compile TypeScript
RUN npx tsc

# Expose the port Fastify will run on
EXPOSE 5173

# Run the compiled server
CMD ["node", "js/index.js"]
