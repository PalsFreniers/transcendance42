FROM node:20-alpine

# Set working directory
WORKDIR /src

COPY . .

RUN chmod +x ./init.sh
RUN ./init.sh

# Expose the port
EXPOSE 3001

# Run the service
CMD ["npm", "run", "start"]