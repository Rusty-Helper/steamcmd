FROM cm2network/steamcmd:root

RUN apt update \
    && apt install -y curl \
    && apt install -y nodejs -y npm

WORKDIR /home/steam/steamcmd
VOLUME /home/steam/steamcmd

COPY . .

RUN npm install

USER steam

EXPOSE 3000

CMD ["node", "./src/index.js"]