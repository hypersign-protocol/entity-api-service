FROM node:20.19
WORKDIR /usr/src/app
COPY ./package.json .
COPY ./yarn.lock .

COPY ./tsconfig.json .

RUN yarn install --frozen-lockfile
COPY . .
RUN yarn build
CMD ["yarn","start:prod"]

