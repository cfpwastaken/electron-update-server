FROM node:18

WORKDIR /

COPY package*.json ./

RUN npm i

COPY . .

EXPOSE 8080

VOLUME ["/apps"]

CMD ["node", "."]