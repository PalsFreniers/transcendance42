FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy dependency declarations
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy app source
COPY . .
# Expose frontend port
EXPOSE 5173

ENTRYPOINT [ "./init.sh" ]
# REMOVE DEV BY START WHEN PROJECT FINISH
CMD ["npm", "run", "start"]