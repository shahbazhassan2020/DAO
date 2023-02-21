const {
  getNamedAccounts,
  deployments,
  ethers,
  network,
  hardhatArguments,
} = require("hardhat")
const {
  developmentChains,
  governorName,
  votingDelay,
  votingPeriod,
  proposalThreshold,
  quorumPercent,
  func,
  minDelay,
} = require("../helper-hardhat-config")
const { assert, expect } = require("chai")

const { keccak256 } = require("@ethersproject/keccak256")
const { toUtf8Bytes } = require("@ethersproject/strings")

const { mine } = require("@nomicfoundation/hardhat-network-helpers")
const { hexStripZeros } = require("ethers/lib/utils")

async function propose() {
  let TimeLock,
    MyGovernor,
    Treasury,
    deployer,
    user,
    user2,
    emptyBytes,
    encodedFunctionCall,
    GovernanceToken

  /* Get Accounts */
  deployer = (await getNamedAccounts()).deployer
  user = (await getNamedAccounts()).user
  user2 = (await getNamedAccounts()).user2

  console.log("***Deploying Contracts***")
  await deployments.fixture()

  console.log("***Fetch All Contracts***")
  GovernanceToken = await ethers.getContract("GovernanceToken", deployer)
  TimeLock = await ethers.getContract("TimeLock", deployer)
  MyGovernor = await ethers.getContract("MyGovernor", deployer)
  Treasury = await ethers.getContract("Treasury", deployer)

  console.log(
    "***Mint NFT for deloyer so that deployer can propose and vote***"
  )
  const nftMinted = await GovernanceToken.mintNFT(deployer, 1)
  const delegate = await GovernanceToken.delegate(
    deployer
  ) /* Votes not counted till they are delegated */

  console.log("***Creating Proposal***")
  const ethersToTransfer = ethers.utils.parseEther("1")
  encodedFunctionCall = Treasury.interface.encodeFunctionData(func, [
    user2,
    ethersToTransfer,
  ])

  const proposal = await MyGovernor.propose(
    [Treasury.address],
    [0],
    [encodedFunctionCall],
    "This is a Proposal to release funds to the user"
  )

  const proposed = await proposal.wait(1)

  /* Fetch Proposal Id */
  const proposalId = proposed.events[0].args[0]
  console.log(`Proposal is created with proposal id ${proposalId}`)

  const proposalStates = [
    "Pending",
    "Active",
    "Canceled",
    "Defeated",
    "Succeeded",
    "Queued",
    "Expired",
    "Executed",
  ]

  console.log("***Fetching Proposal State***")
  const proposalState1 = await MyGovernor.state(proposalId)

  console.log(`Proposal State is ${proposalStates[proposalState1]}`)

  console.log("***Mining until voting delay***")
  for (let i = 0; i < votingDelay + 1; i++) {
    await ethers.provider.send("evm_mine")
  }

  console.log("***Fetching Proposal State***")
  const proposalState2 = await MyGovernor.state(proposalId)
  console.log(`Proposal State is ${proposalStates[proposalState2]}`)

  console.log("***Voting For Proposal***")
  const voted = await MyGovernor.castVote(proposalId, 1)

  console.log("***Voting Period Over***")
  for (let i = 0; i < votingDelay + votingPeriod + 1; i++) {
    await ethers.provider.send("evm_mine")
  }
  console.log("***Fetching Proposal State***")
  const proposalState3 = await MyGovernor.state(proposalId)
  console.log(`Proposal State is ${proposalStates[proposalState3]}`)

  console.log("***Queue Proposal***")
  const descriptionHash = ethers.utils.id(
    "This is a Proposal to release funds to the user"
  )
  const queued = await MyGovernor.queue(
    [Treasury.address],
    [0],
    [encodedFunctionCall],
    descriptionHash
  )

  console.log("***Fetching Proposal State***")
  const proposalState4 = await MyGovernor.state(proposalId)
  console.log(`Proposal State is ${proposalStates[proposalState4]}`)

  console.log("***Execute Proposal***")
  await network.provider.send("evm_increaseTime", [
    minDelay + 1,
  ]) /* Add Min Delay for Time Lock */
  await network.provider.send("evm_mine")

  const execute = await MyGovernor.execute(
    [Treasury.address],
    [0],
    [encodedFunctionCall],
    descriptionHash
  )

  console.log("***Fetching Proposal State***")
  const proposalState5 = await MyGovernor.state(proposalId)
  console.log(`Proposal State is ${proposalStates[proposalState5]}`)

  console.log("***Checking If Fund Released from Trasury ***")
  const isFundReleased = await Treasury.isReleased()
  console.log("isFundRelease", isFundReleased)
}

propose()
  .then(() => process.exit(0))
  .catch((error) => {
    console.log(error)
    process.exit(1)
  })
