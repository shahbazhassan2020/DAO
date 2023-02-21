const { getNamedAccounts, deployments, ethers, network } = require("hardhat")
const {
  developmentChains,
  tokenName,
  tokenSymbol,
  daoVersion,
} = require("../helper-hardhat-config")
const { assert, expect } = require("chai")

!developmentChains.includes(network.name)
  ? descrive.skip
  : describe("Governance Token Unit Tests", async function () {
      let GovernanceToken

      beforeEach(async function () {
        let { deployer } = await getNamedAccounts()
        await deployments.fixture()
        GovernanceToken = await ethers.getContract("GovernanceToken", deployer)
      })

      describe("Constructor", async function () {
        it("Initializes Name of Governance Token Correctly", async function () {
          const tokenNameFromContract = await GovernanceToken.name()
          assert.equal(tokenNameFromContract, tokenName)
        })
        it("Initializes Symbol of Governance Token Correctly", async function () {
          const tokenSymbolFromContract = await GovernanceToken.symbol()
          assert.equal(tokenSymbolFromContract, tokenSymbol)
        })
      })

      describe("Mint Token", async function () {
        let deployer, user, user2
        beforeEach(async function () {
          deployer = (await getNamedAccounts()).deployer
          user = (await getNamedAccounts()).user
          user2 = (await getNamedAccounts()).user2
          const mintedToken = await GovernanceToken.mintNFT(user, 1)
        })

        it("Mints NFT to correct address", async function () {
          const addressOfOwnerOfMintedToken = await GovernanceToken.ownerOf(1)
          assert.equal(addressOfOwnerOfMintedToken, user)
        })

        it("Non Owner Cannot Transfer NFT to other address", async function () {
          await expect(
            GovernanceToken.transferFrom(user, deployer, 1)
          ).to.be.revertedWith("ERC721: caller is not token owner or approved")
        })

        it("Owner Can Transfer NFT to other address", async function () {
          /* Impersonate Governor Contract using another user */

          await hre.network.provider.request({
            method: "hardhat_impersonateAccount",
            params: [user],
          })

          const signer = await ethers.getSigner(user)

          await GovernanceToken.connect(signer).transferFrom(user, deployer, 1)

          await hre.network.provider.request({
            method: "hardhat_stopImpersonatingAccount",
            params: [user],
          })
          /******************************************* */

          const NFTOwner = await GovernanceToken.ownerOf(1)
          assert.equal(deployer, NFTOwner)
        })

        it("Non Owner Cannot Set Approver of NFT to other address", async function () {
          await expect(GovernanceToken.approve(user2, 1)).to.be.revertedWith(
            "ERC721: approve caller is not token owner or approved for all"
          )
        })

        it("Owner Cannot Set be as Approver of NFT", async function () {
          await expect(GovernanceToken.approve(user, 1)).to.be.revertedWith(
            "ERC721: approval to current owner"
          )
        })

        it("Owner Can Set Approver of NFT to other address", async function () {
          /* Impersonate Governor Contract using owner of NFT */

          let signer

          await hre.network.provider.request({
            method: "hardhat_impersonateAccount",
            params: [user],
          })

          signer = await ethers.getSigner(user)

          await GovernanceToken.connect(signer).approve(user2, 1)

          await hre.network.provider.request({
            method: "hardhat_stopImpersonatingAccount",
            params: [user],
          })
          /******************************************* */

          /* Impersonate Governor Contract using approved user NFT */

          await hre.network.provider.request({
            method: "hardhat_impersonateAccount",
            params: [user2],
          })

          signer = await ethers.getSigner(user2)

          await GovernanceToken.connect(signer).transferFrom(user, deployer, 1)

          await hre.network.provider.request({
            method: "hardhat_stopImpersonatingAccount",
            params: [user2],
          })
          /******************************************* */

          const NFTOwner = await GovernanceToken.ownerOf(1)
          assert.equal(deployer, NFTOwner)
        })

        it("Balance of Token Owner is Correctly calculated", async function () {
          const balanceOfUser = await GovernanceToken.balanceOf(user)
          const balanceOfDeployer = await GovernanceToken.balanceOf(deployer)

          assert.equal(balanceOfDeployer, 0)
          assert.equal(balanceOfUser, 1)
        })

        it("Voting Units are correctly calculated", async function () {
          const VotingUnitsOfUser = await GovernanceToken.getVotingUnits(user)
          const VotingUnitsOfDeployer = await GovernanceToken.getVotingUnits(
            deployer
          )

          assert.equal(VotingUnitsOfDeployer, 0)
          assert.equal(VotingUnitsOfUser, 1)
        })
      })

      describe("Mint multiple tokens for same user", async function () {
        let deployer, user, user2
        beforeEach(async function () {
          deployer = (await getNamedAccounts()).deployer
          user = (await getNamedAccounts()).user
          user2 = (await getNamedAccounts()).user2
          let token1Minted = await GovernanceToken.mintNFT(user, 1)
          await token1Minted.wait(1)
          let token2Minted = await GovernanceToken.mintNFT(user, 2)
          await token1Minted.wait(1)
        })

        it("Multiple token minted correctly for the user", async function () {
          const totalTokensAssociatedWithUser = await GovernanceToken.balanceOf(
            user
          )
          assert.equal(totalTokensAssociatedWithUser.toString(), "2")
        })

        it("Voting Units are appropriately set for the user with multiple tokens", async function () {
          const totalVotingUnits = await GovernanceToken.getVotingUnits(user)
          const totalTokensAssociatedWithUser = await GovernanceToken.balanceOf(
            user
          )
          assert.equal(
            totalTokensAssociatedWithUser.toString(),
            totalVotingUnits.toString()
          )
        })

        it("Non-owner cannot set approval for all", async function () {
          await expect(
            GovernanceToken.setApprovalForAll(deployer, true)
          ).to.be.revertedWith("ERC721: approve to caller")
        })

        it("Owner can set approval for all", async function () {
          /* Impersonate Governor Contract using owner of NFT */

          await hre.network.provider.request({
            method: "hardhat_impersonateAccount",
            params: [user],
          })

          signer = await ethers.getSigner(user)

          await GovernanceToken.connect(signer).setApprovalForAll(
            deployer,
            true
          )

          await hre.network.provider.request({
            method: "hardhat_stopImpersonatingAccount",
            params: [user],
          })
          /******************************************* */

          const transferToken = await GovernanceToken.transferFrom(
            user,
            user2,
            1
          )
          await transferToken.wait(1)

          const isApprovedForAll = await GovernanceToken.isApprovedForAll(
            user,
            deployer
          )

          assert.equal(isApprovedForAll, true)

          const balanceOfUser = await GovernanceToken.balanceOf(user)
          const balanceOfUser2 = await GovernanceToken.balanceOf(user2)
          /* Both user and user 2 have equal tokens */
          assert.equal(balanceOfUser.toString(), balanceOfUser2.toString())
        })
      })
    })
