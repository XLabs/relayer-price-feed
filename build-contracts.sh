#!/usr/bin/env bash
echo "building ethereum contracts"
set -e
cd ethereum && echo $(pwd)

forge install --no-git --no-commit

make dependencies

forge build -o build-forge

typechain --target=ethers-v5 --out-dir=./ethers-contracts ./build-forge/!\(test\).sol/*.json
set +e
cd - && echo $(pwd)
