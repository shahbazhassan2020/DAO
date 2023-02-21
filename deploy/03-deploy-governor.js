module.exports.default = async (hre) => {
  const { getNamedAccounts, deployments } = hre
  const { deploy, log, get } = deployments
  const { deployer, user } = await getNamedAccounts()
  const {
    governorName,
    votingDelay,
    votingPeriod,
    proposalThreshold,
    quorumPercent,
    VERIFICATION_BLOCK_CONFIRMATIONS,
    developmentChains,
  } = require("../helper-hardhat-config")

  const chainId = network.config.chainId

  const addressGovernanceToken = await get("GovernanceToken")
  const addressTimeLock = await get("TimeLock")

  const args = [
    addressGovernanceToken.address,
    addressTimeLock.address,
    votingDelay,
    votingPeriod,
    quorumPercent,
    proposalThreshold,
    governorName,
  ]

  const waitBlockConfirmations = developmentChains.includes(network.name)
    ? 0
    : VERIFICATION_BLOCK_CONFIRMATIONS

  const governor = await deploy("MyGovernor", {
    from: deployer,
    args: args,
    log: true,
    waitConfirmations: waitBlockConfirmations,
  })

  log("Governor Contract Deployed")
  // const addressDeployed = await get("GovernanceToken");
  // console.log(`Contract Deployed at ${addressDeployed.address}`);

  if (chainId != 31337 && process.env.ETHERSCAN_API_KEY) {
    await verify(governor.address, args)
  }
  log("-----------------------------------------------------")
}

module.exports.tags = ["all", "governor"]
