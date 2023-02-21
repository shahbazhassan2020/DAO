const {
  getNamedAccounts,
  deployments,
  ethers,
  network,
  hardhatArguments,
} = require("hardhat")
const { developmentChains } = require("../helper-hardhat-config")
const { assert, expect } = require("chai")
const { minDelay, func } = require("../helper-hardhat-config")

!developmentChains.includes(network.name)
  ? describe.skip
  : describe("Time Lock Unit Tests", async function () {
      let TimeLock, MyGovernor, Treasury, deployer, user, user2
      beforeEach(async function () {
        deployer = (await getNamedAccounts()).deployer
        user = (await getNamedAccounts()).user
        user2 = (await getNamedAccounts()).user2

        await deployments.fixture()

        TimeLock = await ethers.getContract("TimeLock", deployer)
        MyGovernor = await ethers.getContract("MyGovernor", deployer)
        Treasury = await ethers.getContract("Treasury", deployer)
      })

      describe("Constructor", async function () {
        it("Min Delay is set correctly", async function () {
          const minDelayFromTimeContract = await TimeLock.getMinDelay()
          assert.equal(minDelayFromTimeContract, minDelay)
        })

        it("Governor has the proposer role", async function () {
          const proposerRole = await TimeLock.PROPOSER_ROLE()
          const hasRole = await TimeLock.hasRole(
            proposerRole,
            MyGovernor.address
          )
          assert.equal(hasRole, true)
        })

        it("Executor Role is assigned to address 0", async function () {
          const executorRole = await TimeLock.EXECUTOR_ROLE()
          const hasRole = await TimeLock.hasRole(
            executorRole,
            "0x0000000000000000000000000000000000000000"
          )
          assert.equal(hasRole, true)
        })

        it("Deployer is admin (For Development Chain Only)", async function () {
          const adminRole = await TimeLock.TIMELOCK_ADMIN_ROLE()
          const hasRole = await TimeLock.hasRole(adminRole, deployer)
          assert.equal(hasRole, true)
        })
      })

      describe("Minimum Delay", async function () {
        it("Min Delay CANNOT be updated by deployer", async function () {
          await expect(TimeLock.updateDelay(80)).to.be.revertedWith(
            "TimelockController: caller must be timelock"
          )
        })

        it("Min Delay CANNOT be updated by governor", async function () {
          /* Add some funds to Governor first so that a transaction can be done on its behalf */
          const currentSigner = await ethers.getSigner(deployer)
          const transaction = await currentSigner.sendTransaction({
            from: deployer,
            to: MyGovernor.address,
            value: ethers.utils.parseEther("1"),
          })

          /* Impersonate Governor to update Time Lock Min Delay */

          await hre.network.provider.request({
            method: "hardhat_impersonateAccount",
            params: [MyGovernor.address],
          })

          const signer = await ethers.getSigner(MyGovernor.address)
          await expect(
            TimeLock.connect(signer).updateDelay(80)
          ).to.be.revertedWith("TimelockController: caller must be timelock")

          await hre.network.provider.request({
            method: "hardhat_stopImpersonatingAccount",
            params: [MyGovernor.address],
          })
          /******************************************* */
        })

        it("Min Delay can be updated by TimeLock itself", async function () {
          /* Add some funds to Time Lock first so that a transaction can be done on its behalf */
          const currentSigner = await ethers.getSigner(deployer)
          const transaction = await currentSigner.sendTransaction({
            from: deployer,
            to: TimeLock.address,
            value: ethers.utils.parseEther("1"),
          })

          const updatedDelay = 77
          /* Impersonate Time Lock to update Time Lock Min Delay */

          await hre.network.provider.request({
            method: "hardhat_impersonateAccount",
            params: [TimeLock.address],
          })

          const signer = await ethers.getSigner(TimeLock.address)
          const delayUpdated = await TimeLock.connect(signer).updateDelay(
            updatedDelay
          )

          await hre.network.provider.request({
            method: "hardhat_stopImpersonatingAccount",
            params: [TimeLock.address],
          })
          /******************************************* */

          const delayFromContract = await TimeLock.getMinDelay()
          assert.equal(delayFromContract.toString(), updatedDelay.toString())
        })
      })

      describe("Grant and Revoke Roles ", async function () {
        it("Administrator (Deployer) can grant role", async function () {
          const role = await TimeLock.TIMELOCK_ADMIN_ROLE()
          const grant = await TimeLock.grantRole(role, user)
          await grant.wait(1)
          const hasRole = await TimeLock.hasRole(role, user)
          assert.equal(hasRole, true)
        })
        it("Administrator (Deployer) can revoke role", async function () {
          const role = await TimeLock.PROPOSER_ROLE()
          const hasRoleBeforeRevoke = await TimeLock.hasRole(
            role,
            MyGovernor.address
          )
          const revoke = await TimeLock.revokeRole(role, MyGovernor.address)
          await revoke.wait(1)
          const hasRoleAfterRevoke = await TimeLock.hasRole(
            role,
            MyGovernor.address
          )

          assert.equal(hasRoleBeforeRevoke, true)
          assert.equal(hasRoleAfterRevoke, false)
        })
        it("Non-Administrator cannot grant role", async function () {
          /* Impersonate Non-Admin User and Try to grant role*/

          await hre.network.provider.request({
            method: "hardhat_impersonateAccount",
            params: [user2],
          })

          const signer = await ethers.getSigner(user2)
          const role = await TimeLock.connect(signer).PROPOSER_ROLE()
          const adminRole = await TimeLock.connect(signer).TIMELOCK_ADMIN_ROLE()

          await expect(TimeLock.connect(signer).grantRole(role, user)).to.be
            .reverted

          await hre.network.provider.request({
            method: "hardhat_stopImpersonatingAccount",
            params: [user2],
          })
          /******************************************* */
        })
        it("Non-Administrator cannot revoke role", async function () {
          const role = await TimeLock.PROPOSER_ROLE()
          const hasRoleBeforeRevoke = await TimeLock.hasRole(
            role,
            MyGovernor.address
          )

          /* Impersonate Non-Admin User and Try to grant role*/

          await hre.network.provider.request({
            method: "hardhat_impersonateAccount",
            params: [user2],
          })

          const signer = await ethers.getSigner(user2)

          await expect(
            TimeLock.connect(signer).revokeRole(role, MyGovernor.address)
          ).to.be.reverted

          await hre.network.provider.request({
            method: "hardhat_stopImpersonatingAccount",
            params: [user2],
          })
          /******************************************* */
        })
        it("Renounce Role can be done by one having the role", async function () {
          const role = await TimeLock.TIMELOCK_ADMIN_ROLE()
          const hasRoleBefore = await TimeLock.hasRole(role, deployer)
          const renounceRole = await TimeLock.renounceRole(role, deployer)
          await renounceRole.wait(1)
          const hasRoleAfter = await TimeLock.hasRole(role, deployer)

          assert.equal(hasRoleBefore, true)
          assert.equal(hasRoleAfter, false)
        })

        it("Renounce Role cannot be done for anyone other than self", async function () {
          const role = await TimeLock.PROPOSER_ROLE()

          await expect(
            TimeLock.renounceRole(role, MyGovernor.address)
          ).to.be.revertedWith(
            "AccessControl: can only renounce roles for self"
          )
        })
      })

      describe("Schedule", async function () {
        it("Non-Proposer Cannot Schedule", async function () {
          const ethersToTransfer = ethers.utils.parseEther("1")
          const encodedFunctionCall = Treasury.interface.encodeFunctionData(
            func,
            [user2, ethersToTransfer]
          )
          const emptyBytes = ethers.constants.HashZero
          const delay = 80
          await expect(
            TimeLock.schedule(
              Treasury.address,
              0,
              encodedFunctionCall,
              emptyBytes,
              emptyBytes,
              delay
            )
          ).to.be.reverted
        })
        it("Proposer Can Schedule", async function () {
          /* Add some funds to Governor first so that a transaction can be done on its behalf */
          const currentSigner = await ethers.getSigner(deployer)
          const transaction = await currentSigner.sendTransaction({
            from: deployer,
            to: MyGovernor.address,
            value: ethers.utils.parseEther("1"),
          })

          /* Impersonate Governor to schedule in Time Lock */

          await hre.network.provider.request({
            method: "hardhat_impersonateAccount",
            params: [MyGovernor.address],
          })

          const signer = await ethers.getSigner(MyGovernor.address)
          const ethersToTransfer = ethers.utils.parseEther("1")
          const encodedFunctionCall = Treasury.interface.encodeFunctionData(
            func,
            [user2, ethersToTransfer]
          )

          const emptyBytes = ethers.constants.HashZero
          const delay = 80

          const tx = await TimeLock.connect(signer).schedule(
            Treasury.address,
            0,
            encodedFunctionCall,
            emptyBytes,
            emptyBytes,
            delay
          )

          const txReciept = await tx.wait(1)

          const id = txReciept.events[0].args[0]

          await hre.network.provider.request({
            method: "hardhat_stopImpersonatingAccount",
            params: [MyGovernor.address],
          })
          /******************************************* */

          const hashOperation = await TimeLock.hashOperation(
            Treasury.address,
            0,
            encodedFunctionCall,
            emptyBytes,
            emptyBytes
          )

          assert.equal(hashOperation, id)

          const isOperation = await TimeLock.isOperation(id)

          assert.equal(isOperation, true)

          // const isOperationReady = await TimeLock.isOperationReady(id)
          // assert.equal(isOperationReady, true)

          // await network.provider.send("evm_increaseTime", [3600])
          // await network.provider.send("evm_mine")

          // const isOperationReady = await TimeLock.isOperationReady(id)
          // assert.equal(isOperationReady, true)
        })
      })

      describe("Execute", async function () {
        let id, delay, emptyBytes, encodedFunctionCall
        beforeEach(async function () {
          /* Add some funds to Governor first so that a transaction can be done on its behalf */
          const currentSigner = await ethers.getSigner(deployer)
          const transaction = await currentSigner.sendTransaction({
            from: deployer,
            to: MyGovernor.address,
            value: ethers.utils.parseEther("1"),
          })

          /* Impersonate Governor to schedule in Time Lock */

          await hre.network.provider.request({
            method: "hardhat_impersonateAccount",
            params: [MyGovernor.address],
          })

          const signer = await ethers.getSigner(MyGovernor.address)
          const ethersToTransfer = ethers.utils.parseEther("1")
          encodedFunctionCall = Treasury.interface.encodeFunctionData(func, [
            user2,
            ethersToTransfer,
          ])

          emptyBytes = ethers.constants.HashZero
          delay = 80

          const tx = await TimeLock.connect(signer).schedule(
            Treasury.address,
            0,
            encodedFunctionCall,
            emptyBytes,
            emptyBytes,
            delay
          )

          const txReciept = await tx.wait(1)

          id = txReciept.events[0].args[0]

          await hre.network.provider.request({
            method: "hardhat_stopImpersonatingAccount",
            params: [MyGovernor.address],
          })
          /******************************************* */
        })
        it("Operation Exists", async function () {
          const isOperation = await TimeLock.isOperation(id)
          assert.equal(isOperation, true)
        })
        it("Operation is Pending", async function () {
          const isOperationPending = await TimeLock.isOperationPending(id)
          assert.equal(isOperationPending, true)
        })
        it("Operation is NOT Ready", async function () {
          const isOperationReady = await TimeLock.isOperationReady(id)
          assert.equal(isOperationReady, false)
        })
        it("Operation is Ready after stipulated time", async function () {
          await network.provider.send("evm_increaseTime", [delay + 1])
          await network.provider.send("evm_mine")
          const isOperationReady = await TimeLock.isOperationReady(id)
          assert.equal(isOperationReady, true)
        })

        it("Proposer cannot Cancel the operation", async function () {
          /* Add some funds to Governor first so that a transaction can be done on its behalf */
          const currentSigner = await ethers.getSigner(deployer)
          const transaction = await currentSigner.sendTransaction({
            from: deployer,
            to: MyGovernor.address,
            value: ethers.utils.parseEther("1"),
          })

          /* Impersonate Governor to cancel operation in Time Lock */

          await hre.network.provider.request({
            method: "hardhat_impersonateAccount",
            params: [MyGovernor.address],
          })

          const signer = await ethers.getSigner(MyGovernor.address)
          await expect(TimeLock.connect(signer).cancel(id)).to.be.reverted

          await hre.network.provider.request({
            method: "hardhat_stopImpersonatingAccount",
            params: [MyGovernor.address],
          })
          /******************************************* */
        })

        it("Address with Canceller role can Cancel the operation", async function () {
          /* Add some funds to Governor first so that a transaction can be done on its behalf */
          const currentSigner = await ethers.getSigner(deployer)
          const transaction = await currentSigner.sendTransaction({
            from: deployer,
            to: MyGovernor.address,
            value: ethers.utils.parseEther("1"),
          })
          /* Give Canceller Role To Governor */
          const cancellerRole = await TimeLock.CANCELLER_ROLE()
          const grantRole = await TimeLock.grantRole(
            cancellerRole,
            MyGovernor.address
          )
          grantRole.wait(1)
          /* Impersonate Governor to cancel operation in Time Lock */

          await hre.network.provider.request({
            method: "hardhat_impersonateAccount",
            params: [MyGovernor.address],
          })

          const signer = await ethers.getSigner(MyGovernor.address)
          const cancel = await TimeLock.connect(signer).cancel(id)

          const cancelled = await cancel.wait(1)

          const cancelledOperation = cancelled.events[0].args[0]

          await hre.network.provider.request({
            method: "hardhat_stopImpersonatingAccount",
            params: [MyGovernor.address],
          })
          /******************************************* */

          assert.equal(cancelledOperation, id)
        })

        it("Operation can be executed once ready", async function () {
          await network.provider.send("evm_increaseTime", [delay + 1])
          await network.provider.send("evm_mine")
          const isOperationReady = await TimeLock.isOperationReady(id)
          assert.equal(isOperationReady, true)

          const isoperationIsDoneBefore = await TimeLock.isOperationDone(id)

          const execute = await TimeLock.execute(
            Treasury.address,
            0,
            encodedFunctionCall,
            emptyBytes,
            emptyBytes
          )

          const executed = await execute.wait(0)

          const isoperationIsDoneAfter = await TimeLock.isOperationDone(id)

          assert.equal(isoperationIsDoneBefore, !isoperationIsDoneAfter)

          const isFundReleased = await Treasury.isReleased()
          assert.equal(isFundReleased, true)
        })
      })
    })
