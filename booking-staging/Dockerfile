FROM node:24.11.1-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY scripts ./scripts
COPY public ./public
COPY src ./src
RUN npm run build

FROM node:24.11.1-alpine
ENV NODE_ENV=production HOST=0.0.0.0 PORT=8080
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/dist ./dist
COPY server ./server
COPY migrations ./migrations
COPY README.md ./README.md
USER node
EXPOSE 8080
CMD ["node", "server/index.js"]
