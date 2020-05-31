FROM node:lts-alpine

WORKDIR /app
COPY package.json .
COPY yarn.lock .
RUN yarn install --prod
COPY . .

CMD ["yarn", "start"]
