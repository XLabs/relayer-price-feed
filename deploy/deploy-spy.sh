#!/usr/bin/env bash

if [[ "$1" == "--testnet" ]]; then
    ENV=testnet
elif [[ "$1" == "--mainnet" ]]; then
    ENV=mainnet
else
    echo "Invalid argument. Please use testnet or mainnet. Example: ./deploy.sh --testnet"
    exit 1
fi

source "./envs/$ENV/env.sh"

kubectl apply -f ./spy.deployment.yaml
