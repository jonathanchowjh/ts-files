import "dotenv/config";

/**
 * =============================
 *            KEYS
 * =============================
 */
export const LOCAL_RPC_URL = process.env.LOCAL_RPC_URL || "";
export const TESTNET_RPC_URL = process.env.TESTNET_RPC_URL || "";
export const GOERLI_RPC_URL = process.env.GOERLI_RPC_URL || "";
export const MAINNET_RPC_URL = process.env.MAINNET_RPC_URL || "";
export const PRIVATE_KEY_1 = process.env.PRIVATE_KEY_1 || "privatKey";
export const PRIVATE_KEY_2 = process.env.PRIVATE_KEY_2 || "privatKey";

export const ADDR_1 = process.env.ADDR_1 || "";
export const ADDR_2 = process.env.ADDR_2 || "";

export const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY || "";
export const ALCHEMY_HTTPS = process.env.ALCHEMY_HTTPS || "";
export const ALCHEMY_WSS = process.env.ALCHEMY_WSS || "";

export const MORALIS_API_KEY = process.env.MORALIS_API_KEY || "";
export const MORALIS_API_KEY_2 = process.env.MORALIS_API_KEY_2 || "";
