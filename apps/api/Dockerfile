FROM node:22-alpine AS builder

WORKDIR /app
COPY package*.json ./
COPY packages/ ./packages/
COPY apps/api/ ./apps/api/
COPY tsconfig.base.json ./

RUN npm install
RUN npm run build --workspace=@blackbox/api

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=4000
ENV HOST=0.0.0.0

COPY --from=builder /app ./

EXPOSE 4000
CMD ["npm", "run", "start", "--workspace=@blackbox/api"]
