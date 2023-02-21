const { NFTMintedToAddress, TokenId } = require("../helper-hardhat-config.js")
const { getNamedAccounts, deployments, ethers, network } = require("hardhat")

async function mint_nfts(toAddress, tokenId) {
  let { deployer } = await getNamedAccounts()
  GovernanceToken = await ethers.getContract("GovernanceToken", deployer)
  const mintedToken = await GovernanceToken.mintNFT(toAddress, tokenId)
  await mintedToken.wait(1)

  /* Impersonate toAddress to delegate */

  await hre.network.provider.request({
    method: "hardhat_impersonateAccount",
    params: [toAddress],
  })

  const signer = await ethers.getSigner(toAddress)

  await GovernanceToken.connect(signer).delegate(toAddress)

  await hre.network.provider.request({
    method: "hardhat_stopImpersonatingAccount",
    params: [toAddress],
  })
  /******************************************* */

  console.log(
    `Token Id ${tokenId} minted for user ${toAddress} and delegation also done`
  )
  console.log("Checking Votes of User by calling getvotes")
  const getVotes = await GovernanceToken.getVotes(toAddress)
  console.log(`Address ${toAddress} has ${getVotes} votes`)
}

mint_nfts(NFTMintedToAddress, TokenId)
  .then(() => process.exit(0))
  .catch((error) => {
    console.log(error)
    process.exit(1)
  })
