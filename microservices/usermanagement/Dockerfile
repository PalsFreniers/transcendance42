FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install
RUN npm install --save-dev @types/better-sqlite3

COPY . .

RUN npm run build

EXPOSE 3001

# REMOVE DEV BY START WHEN PROJECT FINISH
CMD ["npm", "run", "start"]