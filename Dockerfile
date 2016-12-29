FROM iron/node:dev

COPY . ~/

WORKDIR ~/


RUN npm set progress=false
RUN rm -Rf node_modules
RUN npm install

EXPOSE 3001

CMD npm start