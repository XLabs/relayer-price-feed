#!/usr/bin/env bash

set -e
# build ethereum contracts
cd ethereum
npm ci

make .

cd ../


# build wormhole-sdk
node ./compileAnchorIdls.js
cp -r ethereum/ethers-contracts/* sdk/src/ethers-contracts/

cd sdk

npm run build-abis

npm run build-lib

cd ../

set +e


