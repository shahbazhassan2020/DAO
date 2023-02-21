require("@nomicfoundation/hardhat-toolbox")
require("@nomiclabs/hardhat-etherscan")
require("hardhat-deploy")
require("solidity-coverage")
require("hardhat-gas-reporter")
require("@nomicfoundation/hardhat-chai-matchers")
require("@nomiclabs/hardhat-ethers")
require("dotenv").config()
require("solidity-coverage")

const GOERLI_RPC_URL = process.env.GOERLI_RPC_URL || "https://goerli.com"
const GOERLI_PRIVATE_KEY = process.env.GOERLI_PRIVATE_KEY || "0x00"
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "key"
const COIN_MARKET_CAP_API_KEY = process.env.COIN_MARKET_CAP_API_KEY || "key"
const MATIC_TEST_RPC_URL = process.env.MATIC_TEST_RPC_URL || "https://matic.com"
const MATIC_PRIVATE_KEY = process.env.MATIC_PRIVATE_KEY || "0x00"
/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.17",
    settings: { optimizer: { enabled: true, runs: 200 } },
  },
  defaultNetwork: "hardhat",
  networks: {
    goerli: {
      url: GOERLI_RPC_URL,
      accounts: [GOERLI_PRIVATE_KEY],
      chainId: 5,
    },
    matic: {
      url: MATIC_TEST_RPC_URL,
      accounts: [MATIC_PRIVATE_KEY],
      chainId: 80001,
    },
    localhost: {
      url: "http://127.0.0.1:8545/",
      chainId: 31337,
    },
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY,
  },
  namedAccounts: {
    deployer: {
      default: 0,
    },
    user: {
      default: 1,
    },
    user2: {
      default: 2,
    },
  },
  gasReporter: {
    enabled: false,
    outputFile: "gas-report-matic.txt",
    noColors: true,
    currency: "USD",
    coinmarketcap: COIN_MARKET_CAP_API_KEY,
    token: "MATIC",
  },
}
