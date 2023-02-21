// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/governance/TimelockController.sol";

/// @title Treasury Contract
/// @author OpenZeppelin
/// @notice This contract is the time lock contract to add delay to execution of action by DAO.
/// @dev This contract must have no admin and proposer must be the governor contract. Executor can be set to address 0.

contract TimeLock is TimelockController {
  constructor(
    uint256 minDelay,
    address[] memory proposers,
    address[] memory executors,
    address admin
  ) TimelockController(minDelay, proposers, executors, admin) {}
}
