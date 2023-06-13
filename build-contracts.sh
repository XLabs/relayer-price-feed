#!/usr/bin/env bash

if ! which forge &> /dev/null
then
    echo "forge is not installed"
    echo "You can install by running:"
    echo "    curl -L https://foundry.paradigm.xyz | bash"
    echo "    \$HOME/.foundry/bin/foundryup"
fi

echo "building ethereum contracts"
set -e
cd ethereum && echo $(pwd)

forge install --no-git --no-commit

make dependencies

forge build -o build-forge

typechain --target=ethers-v5 --out-dir=./ethers-contracts ./build-forge/!\(test\).sol/*.json
set +e
cd - && echo $(pwd)
