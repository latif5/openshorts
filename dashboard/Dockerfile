# Production build — use when Zeabur Root Directory = dashboard
# ENTRYPOINT in Zeabur UI: /dashboard/zeabur-entrypoint.sh
FROM node:18-alpine

WORKDIR /app

COPY package.json package-lock.json* ./

RUN npm install

COPY . ./

# Zeabur injects VITE_* env vars at build time
RUN npm run build

RUN mkdir -p /dashboard && \
    printf '#!/bin/sh\nset -e\ncd /app\nexec npm run preview -- --host 0.0.0.0 --port "${PORT:-5173}"\n' \
      > /dashboard/zeabur-entrypoint.sh && \
    chmod +x /dashboard/zeabur-entrypoint.sh

EXPOSE 5173

CMD ["/dashboard/zeabur-entrypoint.sh"]
