const developmentChains = ["hardhat", "localhost"]
const proposalFile = "proposals.json"
const tokenName = "DAOTOKEN"
const tokenSymbol = "DAOT"
const daoVersion = "1"
const minDelay = 60
const func = "releaseFunds"

const governorName = "MyGovernor"
const votingDelay = 1
const votingPeriod = 100
const proposalThreshold = 1
const quorumPercent = 4

const numberOfBlocksToMine = 4
const increaseBy = 80

VERIFICATION_BLOCK_CONFIRMATIONS = 6

NFTMintedToAddress = "0xdD2FD4581271e230360230F9337D5c0430Bf44C0"
TokenId = 5

module.exports = {
  developmentChains,
  proposalFile,
  tokenName,
  tokenSymbol,
  daoVersion,
  minDelay,
  func,
  governorName,
  votingDelay,
  votingPeriod,
  proposalThreshold,
  quorumPercent,
  numberOfBlocksToMine,
  increaseBy,
  NFTMintedToAddress,
  TokenId,
}
