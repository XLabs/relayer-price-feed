#!/usr/bin/env bash
set -e
node ./compileAnchorIdls.js;
cp -r ethereum/ethers-contracts sdk/src/ethers-contracts;

cd sdk;
npm ci;
npm run build-abis;
npm run build-lib;
cd ../;

set +e
