# Use when Zeabur Root Directory = dashboard
# ENTRYPOINT in Zeabur UI: /dashboard/zeabur-entrypoint.sh
FROM node:18-alpine

WORKDIR /app

COPY package.json package-lock.json* ./

RUN npm install

COPY . ./

RUN mkdir -p /dashboard && \
    printf '#!/bin/sh\nset -e\ncd /app\nexec npm run dev -- --host 0.0.0.0 --port "${PORT:-5173}"\n' \
      > /dashboard/zeabur-entrypoint.sh && \
    chmod +x /dashboard/zeabur-entrypoint.sh

EXPOSE 5173

CMD ["/dashboard/zeabur-entrypoint.sh"]
