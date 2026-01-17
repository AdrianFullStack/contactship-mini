FROM node:22.16.0-alpine
RUN apk add --no-cache bash vim curl
RUN corepack enable;
WORKDIR /app
CMD ["npm", "start:dev"]