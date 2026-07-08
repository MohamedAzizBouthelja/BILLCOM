FROM nginx:1.25-alpine

RUN apk add --no-cache openssl

# Generate self-signed SSL certificate for localhost. key.pem is created
# 600/root by openssl — the container runs as the non-root "nginx" user
# (uid 101) at runtime, so it needs read access.
RUN mkdir -p /etc/nginx/certs && \
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout /etc/nginx/certs/key.pem \
        -out    /etc/nginx/certs/cert.pem \
        -subj   "/C=TN/ST=Tunis/L=Tunis/O=GadgetZone/OU=Dev/CN=localhost" \
        -addext "subjectAltName=DNS:localhost,IP:127.0.0.1" && \
    chown nginx:nginx /etc/nginx/certs/key.pem /etc/nginx/certs/cert.pem && \
    chmod 400 /etc/nginx/certs/key.pem

COPY nginx.conf /etc/nginx/nginx.conf

# /var/cache/nginx (worker temp buffers) and /run (nginx.pid) are root-owned
# in the base image; the "nginx" user (uid 101) needs write access to both
# since the container runs as non-root from now on.
RUN chown -R nginx:nginx /var/cache/nginx /run

EXPOSE 8080 8443

USER nginx

CMD ["nginx", "-g", "daemon off;"]
