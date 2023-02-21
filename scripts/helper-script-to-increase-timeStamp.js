const {
  getNamedAccounts,
  deployments,
  ethers,
  network,
  hardhatArguments,
} = require("hardhat")

const { increaseBy } = require("../helper-hardhat-config.js")

async function increaseTime(increaseBy) {
  await network.provider.send("evm_increaseTime", [
    increaseBy + 1,
  ]) /* Increase Time */
  await network.provider.send("evm_mine")
}

increaseTime(increaseBy)
  .then(() => process.exit(0))
  .catch((error) => {
    console.log(error)
    process.exit(1)
  })
