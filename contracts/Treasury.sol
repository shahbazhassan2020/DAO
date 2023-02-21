// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";

/// @title Treasury Contract
/// @author Rahul Chauhan
/// @notice Accepts Ether from anyone.Owner of contract should be able to send ether to anyone.
/// @dev This contract is to be used by DAO to perform action. Owner of this contract should be TimeLock

contract Treasury is Ownable {
  uint256 public totalFunds;
  address public payee;
  bool public isReleased;

  event Log(address _addr, uint256 _value);

  constructor() payable {
    totalFunds = msg.value;
    isReleased = false;
  }

  receive() external payable {
    totalFunds += msg.value;
    emit Log(msg.sender, msg.value);
  }

  fallback() external payable {
    totalFunds += msg.value;
    emit Log(msg.sender, msg.value);
  }

  function releaseFunds(
    address _payee,
    uint256 fundsToTransfer
  ) public onlyOwner {
    require(fundsToTransfer <= totalFunds, "Insufficient Funds in treasury");
    isReleased = true;
    totalFunds -= fundsToTransfer;
    payable(_payee).transfer(fundsToTransfer);
    // totalFunds -= fundsToTransfer;
  }
}
