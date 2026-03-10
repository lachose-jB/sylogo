FROM node:20-alpine AS base
WORKDIR /app

# OpenSSL requis par Prisma sur Alpine
RUN apk add --no-cache openssl

# Install back_end deps first (shared services)
COPY back_end/package.json /app/back_end/
RUN cd /app/back_end && npm install --production

COPY back_end/prisma /app/back_end/prisma
RUN cd /app/back_end && npx prisma generate

# Install API deps
COPY api/package.json /app/api/
RUN cd /app/api && npm install --production

# Copy source
COPY back_end/src /app/back_end/src
COPY api/src /app/api/src

# Script de démarrage : migration + serveur
COPY api/start.sh /app/api/start.sh
RUN chmod +x /app/api/start.sh

WORKDIR /app/api
EXPOSE 4000

CMD ["sh", "start.sh"]
