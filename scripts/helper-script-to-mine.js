const {
  getNamedAccounts,
  deployments,
  ethers,
  network,
  hardhatArguments,
} = require("hardhat")

const { numberOfBlocksToMine } = require("../helper-hardhat-config.js")

async function mine(numBlocks) {
  for (let i = 0; i < numBlocks; i++) {
    await ethers.provider.send("evm_mine")
  }
}

mine(numberOfBlocksToMine)
  .then(() => process.exit(0))
  .catch((error) => {
    console.log(error)
    process.exit(1)
  })
