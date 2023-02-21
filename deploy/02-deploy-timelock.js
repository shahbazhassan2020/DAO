module.exports.default = async (hre) => {
  const { getNamedAccounts, deployments } = hre
  const { deploy, log, get } = deployments
  const { deployer, user } = await getNamedAccounts()
  const {
    minDelay,
    VERIFICATION_BLOCK_CONFIRMATIONS,
    developmentChains,
  } = require("../helper-hardhat-config")
  const chainId = network.config.chainId

  const args = [minDelay, [], [], deployer]

  const waitBlockConfirmations = developmentChains.includes(network.name)
    ? 0
    : VERIFICATION_BLOCK_CONFIRMATIONS

  const timeLock = await deploy("TimeLock", {
    from: deployer,
    args: args,
    log: true,
    waitConfirmations: waitBlockConfirmations,
  })

  log("TimeLock Contract Deployed")

  if (chainId != 31337 && process.env.ETHERSCAN_API_KEY) {
    await verify(timeLock.address, args)
  }
  log("-----------------------------------------------------")
}

module.exports.tags = ["all", "timelock"]
