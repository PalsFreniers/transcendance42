FROM node:20-alpine

# Create the directory of the API (Microservice)
WORKDIR /src

COPY . .

RUN chmod +x ./init.sh
RUN ./init.sh

# Expose port
EXPOSE 3003

#Start user services
CMD ["npm", "run", "Start"]