FROM blang/latex:ubuntu

RUN apt-get update
RUN apt-get install -y imagemagick
# Install Node.js
RUN apt-get install --yes curl
RUN curl --silent --location https://deb.nodesource.com/setup_14.x | bash -
RUN apt-get install --yes nodejs

WORKDIR /usr/src/app

COPY . .
RUN npm install

CMD ["node", "app.js"]