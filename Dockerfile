FROM node:20.19
WORKDIR /usr/src/app
COPY ./package.json .
COPY ./package-lock.json .
RUN npx patch-package -y 

COPY ./tsconfig.json .

ENV NODE_OPTIONS="--openssl-legacy-provider   --max-old-space-size=4096"

RUN npm install
COPY . .
RUN npm run build
CMD ["npm","run","start:prod"]

