import axios from "axios";
import { Logger } from "winston";

export interface PriceFetcher {
    fetchPrices(): Promise<Map<string, BigInt>>;
    tokenList(): string[];
}

export class FetcherError extends Error {}

export class CoingeckoPriceFetcher implements PriceFetcher {
    tokens: string[];
    logger: Logger;
    priceCache: any; // @TODO: Add price cache

    constructor(tokenList: string[], logger: Logger) {
        this.tokens = tokenList;
        this.logger = logger;
    }

    public async fetchPrices(): Promise<Map<string, BigInt>> {
        const tokens = this.tokens.join(",");
        console.log("Fetching prices for: ", tokens);
        const { data, status } = await axios.get(
            `https://api.coingecko.com/api/v3/simple/price?ids=${tokens}&vs_currencies=usd`,
            {
                headers: {
                    Accept: "application/json"
                },
            }
        );

        if (status != 200) {
            throw new FetcherError(`Error from coingecko status code: ${status}`);
        }

        return this.formatPriceUpdates(data);
    }

    public tokenList(): string[] {
        return this.tokens;
    }

    private formatPriceUpdates(prices: any) : Map<string, BigInt> {
        const formattedPrices = new Map<string, BigInt>();

        console.log("Formatting prices:", prices);

        return formattedPrices;
    }
}