const fs = require("fs");

const SRC_IDL = "./solana/idl";
const DST_IDL = "./sdk/src/anchor-idl";
const TS = "./sdk/src/solana/types";

const programs = {
    "wormhole.json": "Wormhole",
    "token_bridge.json": "TokenBridge",
    "nft_bridge.json": "NftBridge",
};

function main() {
    if (!fs.existsSync(DST_IDL)) {
        fs.mkdirSync(DST_IDL);
    }

    if (!fs.existsSync(TS)) {
        fs.mkdirSync(TS);
    }

    for (const basename of fs.readdirSync(SRC_IDL)) {
        const idl = DST_IDL + "/" + basename;
        fs.copyFileSync(SRC_IDL + "/" + basename, idl);

        const targetTypescript = TS + "/" + snakeToCamel(basename).replace("json", "ts");

        const programType = programs[basename];
        fs.writeFileSync(targetTypescript, `export type ${programType} = `);
        fs.appendFileSync(targetTypescript, fs.readFileSync(idl));
    }
}

const snakeToCamel = str =>
  str.toLowerCase().replace(/([-_][a-z])/g, group =>
    group
      .toUpperCase()
      .replace('-', '')
      .replace('_', '')
  );

main();