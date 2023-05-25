#! /bin/sh
kubectl delete secret generic-relayer-key --ignore-not-found --namespace=xlabs-generic-relayer

kubectl create secret generic generic-relayer-key \
    --from-literal=EVM_PRIVATE_KEY=${EVM_PRIVATE_KEY} \
    --namespace=xlabs-generic-relayer
