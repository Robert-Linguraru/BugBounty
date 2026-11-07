FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install
RUN apk add --no-cache openssl

COPY . .

EXPOSE 80

CMD ["npm", "run", "dev"]