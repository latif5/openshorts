FROM node:18-alpine

WORKDIR /app

# Copy package files from the dashboard subdirectory relative to the repo root build context
COPY dashboard/package.json dashboard/package-lock.json* ./

RUN npm install

# Copy all files from the dashboard subdirectory
COPY dashboard/ ./

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host"]
