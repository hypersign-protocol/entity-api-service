FROM node:16
WORKDIR /usr/src/app
COPY ./package.json .
COPY ./tsconfig.json .

# using npm instead of yarn
RUN npm install
COPY . .
CMD ["npm","run","start:dev"]

