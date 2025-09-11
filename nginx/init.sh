#!/bin/sh

if [ -z "$VITE_LOCAL_ADDRESS" ]; then
  echo "❌ Error : VITE_LOCAL_ADDRESS not define"
  exit 1
fi

envsubst '$VITE_LOCAL_ADDRESS' \
  < /etc/nginx/nginx.conf.template \
  > /etc/nginx/nginx.conf

exec nginx -g "daemon off;"