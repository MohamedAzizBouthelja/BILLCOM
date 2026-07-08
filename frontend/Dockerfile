# Stage 1: Build React Application
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci


COPY . .
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:1.27-alpine

# Applique les derniers correctifs de sécurité Alpine disponibles au moment du
# build, indépendamment de la date de gel de l'image de base nginx:1.27-alpine.
RUN apk update && apk upgrade --no-cache

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

# /var/cache/nginx (worker temp buffers) and /run (nginx.pid) are root-owned
# in the base image; the "nginx" user (uid 101) needs write access to both
# since the container runs as non-root from now on.
RUN chown -R nginx:nginx /var/cache/nginx /run

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget --quiet --spider http://127.0.0.1:3000/ || exit 1

USER nginx

CMD ["nginx", "-g", "daemon off;"]
