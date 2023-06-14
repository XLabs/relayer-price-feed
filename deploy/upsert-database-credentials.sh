#! /bin/sh

kubectl delete secret generic-relayer-db --ignore-not-found --namespace=xlabs-generic-relayer

kubectl create secret generic generic-relayer-db \
    --from-literal=API_STORAGE_CONNECTION_URL=${API_STORAGE_CONNECTION_URL} \
    --namespace=xlabs-generic-relayer
