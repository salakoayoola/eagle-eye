FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
# Only substitute our env vars, not nginx's own $host/$remote_addr/etc.
ENV NGINX_ENVSUBST_FILTER=^(COPYPARTY_URL|COMPANION_API_URL)$
EXPOSE 80
