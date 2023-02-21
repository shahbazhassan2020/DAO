# BASIC DAO SMART CONTRACTS

This project demonstrates a basic DAO use case. After pulling this repository take following steps -

1. Delete package-lock.json
2. Do npm init
3. Do npm --dev hardhat @nomiclabs/hardhat-ethers@npm:hardhat-deploy-ethers ethers
4. Create a .env file in root folder. And Add following in that .env -
   GOERLI_RPC_URL = "https://eth-goerli.g.alchemy.com/v2/FjkF7kr2YOT0uxZPF-E6Vw3tcUL8nQZT"
   GOERLI_PRIVATE_KEY = <Private Key for Account from Metamasj>
   ETHERSCAN_API_KEY= <Etherscan api>

Try running some of the following tasks:

```shell
npx hardhat help
npx hardhat test
REPORT_GAS=true npx hardhat test
npx hardhat node
npx hardhat run scripts/deploy.js
```
