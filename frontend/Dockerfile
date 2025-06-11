# Dockerfile
FROM node:20-alpine

WORKDIR /src

COPY . .

RUN chmod +x ./front.sh
RUN ./front.sh

# Serve with a simple static server (or nginx)
CMD ["serve", "-s", "dist", "-l", "5173"]

EXPOSE 5173
