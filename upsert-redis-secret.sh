#! /bin/sh

kubectl delete secret generic-relayer-redis --ignore-not-found --namespace=xlabs-generic-relayer

kubectl create secret generic generic-relayer-redis \
    --from-literal=REDIS_CLUSTER_ENDPOINTS=${REDIS_CLUSTER_ENDPOINTS} \
    --from-literal=REDIS_USERNAME=${REDIS_USERNAME} \
    --from-literal=REDIS_PASSWORD=${REDIS_PASSWORD} \
    --from-literal=REDIS_TLS=true \
    --namespace=xlabs-generic-relayer
