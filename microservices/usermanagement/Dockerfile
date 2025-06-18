FROM node:20-alpine

WORKDIR /src

COPY package*.json ./

RUN npm install
RUN npm install --save-dev @types/better-sqlite3

COPY . .

RUN npx tsc

CMD ["node", "dist/index.js"]