### Generic Relayer Deployment:

This repository contains necessary artifacts to perform the deployment of the "generic-relayer", which is located in the [wormhole monorepo](https://github.com/wormhole-foundation/wormhole/tree/main/relayer)

To perform a deploy:
- Create necessary `env.sh` files in `envs/<network>/env.sh` (see sample-env.sh to find out which variables is supposed to contain)
- If necessary add/remove/change non-secret environment variables in `envs/<network>/configmap.yaml`
- run `bash -c ./deploy.sh` (you might need to allow your user execution privileges to the file)

### TODOS:
- Add automation to `deploy.sh` so that it builds wormhole's repo and extracts the `contracts.json` file
