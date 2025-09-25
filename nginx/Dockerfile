# Use official NGINX base image
FROM nginx:alpine

# Remove default config
RUN rm /etc/nginx/conf.d/default.conf
RUN apk add --no-cache gettext openssl
RUN mkdir -p /etc/nginx/ssl

COPY nginx.conf.template /etc/nginx/nginx.conf.template
COPY init.sh /init.sh
RUN chmod +x /init.sh

CMD ["/init.sh"]
