FROM node:16
WORKDIR /usr/src/app
COPY ./package.json .
RUN npx patch-package -y 

COPY ./tsconfig.json .
RUN npm install
COPY . .
RUN npm run build
CMD ["npm","run","start"]

