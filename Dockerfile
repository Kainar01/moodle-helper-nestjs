FROM ubuntu:18.04

RUN apt-get update && \
    apt-get install -y make curl wget gcc firefox 

RUN wget https://github.com/mozilla/geckodriver/releases/download/v0.30.0/geckodriver-v0.30.0-linux64.tar.gz && \
    tar -xvzf geckodriver* && \
    chmod a+x geckodriver && \ 
    mv geckodriver /usr/local/bin/

RUN curl -sL https://deb.nodesource.com/setup_16.x | bash -

RUN apt-get install -y nodejs

RUN npm install --global yarn 

WORKDIR /app

COPY package.json ./
COPY yarn.lock ./

RUN yarn install --silent

COPY . ./

ENTRYPOINT []

CMD [ "yarn", "start"]