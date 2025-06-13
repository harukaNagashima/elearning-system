# frontend/Dockerfile
FROM node:18-alpine

WORKDIR /app

# package.json と package-lock.json をコピー
COPY package*.json ./

# 依存関係をインストール
RUN npm install

# アプリケーションコードをコピー
COPY . .

EXPOSE 3000

CMD ["npm", "start"]
