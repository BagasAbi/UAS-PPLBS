FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 5173

# Running in dev mode for demonstration purposes so hot-reload works if mounted
CMD ["npm", "run", "dev", "--", "--host"]
