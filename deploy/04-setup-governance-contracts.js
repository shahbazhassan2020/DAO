const { time } = require("@nomicfoundation/hardhat-network-helpers")
const { ethers, network } = require("hardhat")
const { developmentChains } = require("../helper-hardhat-config")

module.exports.default = async (hre) => {
  const { getNamedAccounts, deployments } = hre
  const { deploy, log, get } = deployments
  const { deployer, user } = await getNamedAccounts()
  const chainId = network.config.chainId

  const timeLock = await ethers.getContract("TimeLock", deployer)
  const governor = await ethers.getContract("MyGovernor", deployer)

  log("Setting up roles...")
  const proposerRole = await timeLock.PROPOSER_ROLE()
  const executorRole = await timeLock.EXECUTOR_ROLE()
  const adminRole = await timeLock.TIMELOCK_ADMIN_ROLE()

  //   const checkRole = await timeLock.hasRole(adminRole, deployer)
  //   console.log(checkRole)

  const proposerTx = await timeLock.grantRole(proposerRole, governor.address)
  await proposerTx.wait(1)

  const executorTx = await timeLock.grantRole(
    executorRole,
    "0x0000000000000000000000000000000000000000"
  )
  await executorTx.wait(1)

  if (!developmentChains.includes(network.name)) {
    // const revokeTx = await timeLock.revokeRole(adminRole, deployer)
    // revokeTx.wait(1)
  }
  log("Done")
  log("-----------------------------------------------------")
}

module.exports.tags = ["all"]
