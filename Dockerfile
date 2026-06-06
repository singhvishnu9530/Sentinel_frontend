# Sentinel AI frontend — build the Vite app, serve it with nginx
FROM node:20-alpine AS build

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
# VITE_API_URL is read from .env.production at build time (Vite picks up VITE_* vars).
# Set it there to your deployed backend URL before building.
RUN npm run build

# ── Serve the static build ──
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
