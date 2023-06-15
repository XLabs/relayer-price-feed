FROM node:19.6.1-slim@sha256:a1ba21bf0c92931d02a8416f0a54daad66cb36a85d2b73af9d73b044f5f57cfc

RUN apt-get update && apt-get -y install \
  git python make curl netcat

RUN npm i typescript -g
RUN npm i ts-node -g
RUN npm i typechain -g

RUN curl -L https://foundry.paradigm.xyz | bash
RUN $HOME/.foundry/bin/foundryup

RUN mv /root/.foundry/bin/forge /bin/forge

WORKDIR /home/node/app

COPY --chown=node:node ./ethereum ./ethereum
COPY --chown=node:node ./solana ./solana
COPY --chown=node:node ./sdk ./sdk

COPY --chown=node:node ./compileAnchorIdls.js .
COPY --chown=node:node ./build-contracts.sh .
COPY --chown=node:node ./build-sdk.sh .

WORKDIR /home/node/app/ethereum/
RUN npm ci

WORKDIR /home/node/app/sdk/
RUN npm ci

WORKDIR /home/node/app

RUN chmod u+x ./build-sdk.sh
RUN chmod u+x ./build-contracts.sh

RUN bash -c ./build-sdk.sh

RUN bash -c ./build-contracts.sh

COPY package.json .
COPY package-lock.json .

RUN npm ci

COPY --chown=node:node ./src ./src

COPY tsconfig.json .
RUN tsc
