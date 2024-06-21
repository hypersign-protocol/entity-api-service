FROM node:18
RUN npm install -g npm@latest
WORKDIR /usr/src/app
COPY ./package.json .
RUN npx patch-package -y 

COPY ./tsconfig.json .
ENV NODE_OPTIONS=--openssl-legacy-provider
ENV NODE_OPTIONS="--max-old-space-size=4096"

RUN npm install
COPY . .
RUN npm run build
CMD ["npm","run","start"]

