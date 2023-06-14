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

#
# Handle contracts.json file.
#

CONTRACTS_FILE_NAME="contracts.$TAG.json"
TARGET_CONTRACTS_DIR="./deployed-contracts/$ENV"
TARGET_CONTRACTS_PATH="$TARGET_CONTRACTS_DIR/$CONTRACTS_FILE_NAME"
SOURCE_CONTRACTS_PATH="../ethereum/ts-scripts/relayer/config/$ENV/contracts.json"

if [ ! -f "../ethereum/ts-scripts/relayer/config/$ENV/contracts.json" ]; then
    echo "contracts.json file not found. Will build contracts first."
    read -p "Press enter to continue"
    set -e
    cd ../ && bash -c build-contracts.sh && cd -
    set +e
fi

if [ ! -d "$TARGET_CONTRACTS_DIR" ]; then
    mkdir -p $TARGET_CONTRACTS_DIR
fi

if [ -f "$TARGET_CONTRACTS_PATH" ]; then
    echo "WARNING: $TARGET_CONTRACTS_PATH already exists. This will be overwritten."
    read -p "Press enter to continue"
    rm $TARGET_CONTRACTS_PATH
fi

cp $SOURCE_CONTRACTS_PATH $TARGET_CONTRACTS_PATH

cp kustomization.template.yaml kustomization.yaml
sed -i "s/<CONTRACTS_PATH>/.\/deployed-contracts\/$CONTRACTS_FILE_NAME/g" kustomization.yaml

cp envs/$ENV/configmap.template.yaml envs/$ENV/configmap.yaml
sed -i "s/<CONTRACTS_FILE_NAME>/$CONTRACTS_FILE_NAME/g" envs/$ENV/configmap.yaml


#
# Handle deployment rendering and applying kustomization
#

source "./envs/$ENV/env.sh"

kubetpl render ./relayer.deployment.yaml -s TAG="$TAG" -s AWS_ACCOUNT="$AWS_ACCOUNT" -s ENV_FLAG="$ENV" > rendered-relayer.deployment.yaml

#
# Actual deployment:
#

kubectl apply -f envs/$ENV/configmap.yaml

kubectl apply -k .

kubectl apply -f ./relayer.service.yaml

#
# Handle clean up
#

rm kustomization.yaml

rm rendered-relayer.deployment.yaml

rm envs/$ENV/configmap.yaml
