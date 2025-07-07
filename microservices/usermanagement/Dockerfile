FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install
RUN npm install --save-dev @types/better-sqlite3

COPY . .

RUN npx tsc

EXPOSE 3001

CMD ["node", "dist/index.js"]