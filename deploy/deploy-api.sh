#!/usr/bin/env bash

#
# Parse arguments
#

if [[ "$1" == "--testnet" ]]; then
    AWS_ACCOUNT=$AWS_ACCOUNT_STAGING
    ENV=testnet
elif [[ "$1" == "--mainnet" ]]; then
    AWS_ACCOUNT=$AWS_ACCOUNT_PRODUCTION
    ENV=mainnet
else
    echo "Invalid argument. Please use testnet or mainnet. and the tag as a positional parameter. Example: ./deploy.sh testnet 2.0.1"
    exit 1
fi

if [ -z "$AWS_ACCOUNT" ]; then
    echo "AWS_ACCOUNT variable is not set. Please set AWS_ACCOUNT_<STAGING|PRODUCTION> in your environment."
    exit 1
fi

if [ -z "$2" ]; then
    TAG=$(npm run version --silent)
else
    TAG=$2
fi

source "./envs/$ENV/env.sh"

kubectl apply -f ./envs/$ENV/api.configmap.yaml
kubetpl render ./api.deployment.yaml -s AWS_ACCOUNT="$AWS_ACCOUNT" -s TAG="$TAG" | kubectl apply -f -
kubectl apply -f api.service.yaml
