#!/usr/bin/env bash

if [ $# -ne 2 ]; then
    echo "Invalid argument. Please use testnet or mainnet. and the tag as a positional parameter. Example: ./deploy.sh testnet 2.0.1"
    exit 1
fi

if [[ "$1" == "--testnet" ]]; then
    ENV=testnet
elif [[ "$1" == "--mainnet" ]]; then
    ENV=mainnet
else
    echo "Invalid argument. Please use testnet or mainnet. and the tag as a positional parameter. Example: ./deploy.sh testnet 2.0.1"
    exit 1
fi

