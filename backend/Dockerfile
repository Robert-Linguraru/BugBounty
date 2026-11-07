FROM node:20-alpine

RUN apk add --no-cache openssl make g++ python3

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5000

CMD ["npm", "run", "dev"]