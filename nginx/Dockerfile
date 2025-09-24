# Use official NGINX base image
FROM nginx:alpine

# Remove default config
RUN rm /etc/nginx/conf.d/default.conf
RUN apk add --no-cache gettext openssl
RUN mkdir -p /etc/nginx/ssl

RUN  openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/nginx/ssl/selfsigned.key \
    -out /etc/nginx/ssl/selfsigned.crt \
    -subj "/C=FR/ST=Paris/L=Paris/O=42/OU=Student/CN=$VITE_LOCAL_ADRESS"

COPY nginx.conf.template /etc/nginx/nginx.conf.template
COPY init.sh /init.sh
RUN chmod +x /init.sh

CMD ["/init.sh"]
