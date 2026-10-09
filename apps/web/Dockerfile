FROM node:22-alpine AS builder

WORKDIR /app
COPY package*.json ./
COPY packages/ ./packages/
COPY apps/web/ ./apps/web/
COPY tsconfig.base.json ./

RUN npm install
RUN npm run build --workspace=@blackbox/web

FROM nginx:alpine AS runner
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html
EXPOSE 3000

RUN sed -i 's/listen       80;/listen       3000;/g' /etc/nginx/conf.d/default.conf

CMD ["nginx", "-g", "daemon off;"]
