FROM node:18-alpine

WORKDIR /app

COPY package.json package-lock.json* ./

RUN npm install

COPY . ./

# Zeabur may use the Root Directory path (/dashboard) as the container entrypoint.
COPY zeabur-entrypoint.sh /dashboard
RUN chmod +x /dashboard

EXPOSE 5173

CMD ["/dashboard"]
