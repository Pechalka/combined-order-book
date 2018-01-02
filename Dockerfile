FROM node:6.9.5 as frontend
WORKDIR /src
COPY ./frontend /src
RUN npm install
RUN npm run build


FROM node:carbon
WORKDIR /usr/src/app
COPY --from=frontend /src/build ./public

COPY /backend/ ./

RUN npm install


EXPOSE 4000
CMD [ "npm", "start" ]