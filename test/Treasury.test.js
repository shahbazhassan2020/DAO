const { getNamedAccounts, deployments, ethers, network } = require("hardhat")
const { developmentChains } = require("../helper-hardhat-config")
const { assert, expect } = require("chai")

!developmentChains.includes(network.name)
  ? descrive.skip
  : describe("Treasury Unit Tests", async function () {
      let treasury, timeLock, deployer

      beforeEach(async function () {
        let { deployer } = await getNamedAccounts()
        await deployments.fixture()
        treasury = await ethers.getContract("Treasury", deployer)
        timelock = await ethers.getContract("TimeLock", deployer)
      })

      describe("Constructor", async function () {
        it("Initializes the isReleased variable of Treasury Correctly", async function () {
          const isReleased = await treasury.isReleased()
          assert.equal(isReleased, false)
        })

        it("One Eth is present in Treasury funds upon deployment", async function () {
          const totalFunds = await treasury.totalFunds()
          assert.equal(ethers.utils.formatEther(totalFunds).toString(), "1.0")
        })

        it("Time Lock is the owner of Treasury contract", async function () {
          const owner = await treasury.owner()
          assert.equal(owner, timelock.address)
        })
      })

      describe("Recieve Funds", async function () {
        it("Treasury can recieve Funds from anyone", async function () {
          const InitialBalance = await treasury.provider.getBalance(
            treasury.address
          )
          const fundsTobeAdded = await ethers.utils.parseEther("1")

          let { deployer } = await getNamedAccounts()
          const currentSigner = await ethers.getSigner(deployer)
          const transaction = await currentSigner.sendTransaction({
            from: deployer,
            to: treasury.address,
            value: fundsTobeAdded,
          })

          const expectedAmount = ethers.utils.formatEther(
            InitialBalance.add(fundsTobeAdded)
          )

          const actualAmount = ethers.utils.formatEther(
            await treasury.provider.getBalance(treasury.address)
          )
          assert.equal(expectedAmount, actualAmount)
        })
      })

      describe("Release Funds", async function () {
        it("Non-Owner cannot Release funds", async function () {
          let { deployer, user } = await getNamedAccounts()
          const fundsToBeReleased = ethers.utils.parseEther("1")
          await expect(
            treasury.releaseFunds(user, fundsToBeReleased)
          ).to.be.revertedWith("Ownable: caller is not the owner")
        })

        it("Owner can release funds", async function () {
          let { deployer, user } = await getNamedAccounts()

          const fundsToBeReleased = ethers.utils.parseEther("0.5")
          const InitialBalance = await treasury.provider.getBalance(
            treasury.address
          )

          /* Add some funds to Time Lock first so that a transaction can be done on its behalf */
          const currentSigner = await ethers.getSigner(deployer)
          const transaction = await currentSigner.sendTransaction({
            from: deployer,
            to: timelock.address,
            value: ethers.utils.parseEther("1"),
          })

          /* Impersonate Time Lock to transfer funds */

          await hre.network.provider.request({
            method: "hardhat_impersonateAccount",
            params: [timelock.address],
          })

          const signer = await ethers.getSigner(timelock.address)

          await treasury.connect(signer).releaseFunds(user, fundsToBeReleased)

          await hre.network.provider.request({
            method: "hardhat_stopImpersonatingAccount",
            params: [timelock.address],
          })
          /******************************************* */

          const finalBalance = await treasury.provider.getBalance(
            treasury.address
          )

          assert.equal(
            ethers.utils.formatEther(finalBalance.add(fundsToBeReleased)),
            ethers.utils.formatEther(InitialBalance)
          )
        })

        it("Public Storage Data is set correctly after release of funds", async function () {
          let { deployer, user } = await getNamedAccounts()

          const isReleasedBefore = await treasury.isReleased()
          const fundsToBeReleased = ethers.utils.parseEther("0.5")
          const InitialBalance = await treasury.provider.getBalance(
            treasury.address
          )

          /* Add some funds to Time Lock first so that a transaction can be done on its behalf */
          const currentSigner = await ethers.getSigner(deployer)
          const transaction = await currentSigner.sendTransaction({
            from: deployer,
            to: timelock.address,
            value: ethers.utils.parseEther("1"),
          })

          /* Impersonate Time Lock to transfer funds */

          await hre.network.provider.request({
            method: "hardhat_impersonateAccount",
            params: [timelock.address],
          })

          const signer = await ethers.getSigner(timelock.address)

          await treasury.connect(signer).releaseFunds(user, fundsToBeReleased)

          await hre.network.provider.request({
            method: "hardhat_stopImpersonatingAccount",
            params: [timelock.address],
          })
          /******************************************* */

          const finalBalance = await treasury.totalFunds()

          assert.equal(
            ethers.utils.formatEther(finalBalance.add(fundsToBeReleased)),
            ethers.utils.formatEther(InitialBalance)
          )

          const isReleasedAfter = await treasury.isReleased()

          assert.equal(isReleasedBefore, !isReleasedAfter)
        })
      })
    })
