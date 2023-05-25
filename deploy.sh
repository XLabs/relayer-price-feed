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

source "./envs/$ENV/env.sh"

bash ./upsert-privatekey-secret.sh
bash ./upsert-redis-secret.sh

kubectl apply -f envs/$ENV/configmap.yaml
kubectl apply -f ./spy.deployment.yaml
kubetpl render ./generic-relayer.deployment.yaml -s TAG="$2"   > rendered-generic-relayer.deployment.yaml
kubectl apply -k .

rm -rf rendered-generic-relayer.deployment.yaml

kubectl apply -f ./generic-relayer.service.yaml
