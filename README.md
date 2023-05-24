### TODOS:

- add Dockerfile: Currently the generic relayer engine needs to be built from within the monorepo due to two reasons:
    1. it builds the ethereum contracts in the docker image (this could also be build separetly and passed as a volume)
    2. it imports the wormhole-sdk using a relative reference (file: "../../../.."), so the relayer engine code needs to be contained within the monorepo context. This will be solved once the wormhole-sdk is published and we can import it from npm

- 