FROM node:20-alpine

WORKDIR /src

COPY package*.json ./

RUN npm install

COPY . .

RUN npx tsc

CMD ["node", "js/index.js"]