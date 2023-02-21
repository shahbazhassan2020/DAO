const { ethers } = require("hardhat")

const {
  VERIFICATION_BLOCK_CONFIRMATIONS,
  developmentChains,
} = require("../helper-hardhat-config")

module.exports.default = async (hre) => {
  console.log("Deployment Begins for Treasury Contract")
  const { getNamedAccounts, deployments } = hre
  const { deploy, log, get } = deployments
  const { deployer, user } = await getNamedAccounts()
  const chainId = network.config.chainId

  const args = []
  const initialFund =
    chainId === 31337
      ? ethers.utils.parseEther("1")
      : ethers.utils.parseEther("0")

  const waitBlockConfirmations = developmentChains.includes(network.name)
    ? 0
    : VERIFICATION_BLOCK_CONFIRMATIONS

  const treasury = await deploy("Treasury", {
    from: deployer,
    args: args,
    log: true,
    value: initialFund,
    waitConfirmations: waitBlockConfirmations,
  })

  log("Treasury Contract Deployed")
  // const addressDeployed = await get("GovernanceToken");
  // console.log(`Contract Deployed at ${addressDeployed.address}`);

  if (chainId != 31337 && process.env.ETHERSCAN_API_KEY) {
    await verify(treasury.address, args)
  }

  log("transferring ownership of Treasury contract to TimeLock ")
  const timeLock = await ethers.getContract("TimeLock")
  const treasuryContract = await ethers.getContract("Treasury")

  const transferOwnershiptx = await treasuryContract.transferOwnership(
    timeLock.address
  )
  await transferOwnershiptx.wait(1)
  log("Done")
  log("-----------------------------------------------------")
}

module.exports.tags = ["all", "treasury"]
