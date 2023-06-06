#!/usr/bin/env bash

if [[ "$1" == "--testnet" ]]; then
    ENV=testnet
elif [[ "$1" == "--mainnet" ]]; then
    ENV=mainnet
else
    echo "Invalid argument. Please use testnet or mainnet.Example: ./deploy-secrets.sh --testnet"
    exit 1
fi

source "./envs/$ENV/env.sh"

bash ./upsert-privatekey-secret.sh
bash ./upsert-redis-secret.sh
