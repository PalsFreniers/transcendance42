#!/bin/sh

if [ -z "$VITE_LOCAL_ADDRESS" ]; then
  echo "❌ Error : VITE_LOCAL_ADDRESS not define"
  exit 1
fi

RUN  openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/nginx/ssl/selfsigned.key \
    -out /etc/nginx/ssl/selfsigned.crt \
    -subj "/C=FR/ST=Paris/L=Paris/O=42/OU=Student/CN=$DOMAIN_NAME"

envsubst '$VITE_LOCAL_ADDRESS' \
  < /etc/nginx/nginx.conf.template \
  > /etc/nginx/nginx.conf

exec nginx -g "daemon off;"