FROM node:16
WORKDIR /usr/src/app
COPY ./package.json .
COPY ./tsconfig.json .
RUN npm install
COPY . .
CMD ["npm", "start"]
