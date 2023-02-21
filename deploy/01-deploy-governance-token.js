const { verify } = require("../utils/verify")
const {
  tokenName,
  tokenSymbol,
  daoVersion,
  VERIFICATION_BLOCK_CONFIRMATIONS,
  developmentChains,
} = require("../helper-hardhat-config")

module.exports.default = async (hre) => {
  const { getNamedAccounts, deployments } = hre
  const { deploy, log, get } = deployments
  const { deployer } = await getNamedAccounts()

  const chainId = network.config.chainId

  const waitBlockConfirmations = developmentChains.includes(network.name)
    ? 0
    : VERIFICATION_BLOCK_CONFIRMATIONS

  const args = [tokenName, tokenSymbol, daoVersion]
  const governanceToken = await deploy("GovernanceToken", {
    from: deployer,
    args: args,
    log: true,
    waitConfirmations: waitBlockConfirmations,
  })

  log("GovernanceToken Contract Deployed")
  // const addressDeployed = await get("GovernanceToken");
  // console.log(`Contract Deployed at ${addressDeployed.address}`);

  if (chainId != 31337 && process.env.ETHERSCAN_API_KEY) {
    await verify(governanceToken.address, args)
  }
  log("-----------------------------------------------------")
}

module.exports.tags = ["all", "token"]
