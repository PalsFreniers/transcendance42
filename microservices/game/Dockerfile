FROM node:20-alpine

# Set working directory
WORKDIR /src

COPY . .

RUN chmod +x ./init.sh
RUN ./init.sh

# Expose the port
EXPOSE 3002

# Run the service
CMD ["npm", "run", "start"]