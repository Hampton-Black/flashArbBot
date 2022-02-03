// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;
pragma experimental ABIEncoderV2;

import { IERC20 } from "Interfaces.sol";
import { SafeERC20, SafeMath } from "Libraries.sol";

contract arbBot {
  // Config addresses
  address payable OWNER;

  // Modifiers
  modifier onlyOwner() {
    require(msg.sender == OWNER, "caller is not the owner!");
    _;
  }

  // Constructor
  constructor() public payable {
    _getWeth(msg.value);
    _approveWeth(msg.value);
    OWNER = msg.sender;
  }

  // Arbitration
  function arb(address _fromToken, address _toToken, uint256 _fromAmount, /* params needed for DEX swap */) onlyOwner public payable {
    _arb(_fromToken, _toToken, _fromAmount, /* params for DEX swap */ );
  }

  function _arb(address _fromToken, address _toToken, uint256 _fromAmount, /* params needed for DEX swap */) internal {
    // Track original balance
    uint256 _startBalance = IERC20(_fromToken).balanceOf(address(this));

    // Perform arb trade
    _trade(_fromToken, _toToken, _fromAmount, /* params for DEX swap */ );

    // Track result balance
    uint256 _endBalance = IERC20(_fromToken).balanceOf(address(this));

    // Require arbitrage to be profitable
    require(_endBalance > _startBalance, "End balance must exceed start balance.");
  }

  // Trade
  function trade(address _fromToken, address _toToken, uint256 _fromAmount, /* params needed for DEX swap */) onlyOwner public payable {
    _trade(_fromToken, _toToken, _fromAmount, /* params for DEX swap */ );
  }

  function _trade(address _fromToken, address _toToken, uint256 _fromAmount, /* params needed for DEX swap */) internal {
    // Track balance of token RECEIVED from trade
    uint256 _beforeBalance = IERC20(_toToken).balanceOf(address(this));

    // swap on DEX1: give _fromToken, receive _toToken
    _Dex1Swap(_fromToken, _fromAmount, _Dex1Data);

    // Calculate how much of the token we received
    uint256 _afterBalance = IERC20(_toToken).balanceOf(address(this));

    // Read _toToken balance after swap
    uint256 _toAmount = _afterBalance - _beforeBalance;

    // Swap on DEX2: give _toToken, receive _fromToken
    _Dex2Swap(_toToken, _fromToken, _toAmount, _Dex2Data);
  }

  // DEX 1 swap
  function Dex1Swap(address _from, uint256 _amount, bytes memory _calldataHexString) onlyOwner public payable {
    _Dex1Swap(_from, _amount, _calldataHexString);
  }

  function _Dex1Swap(address _from, uint256 _amount, bytes memory _calldataHexString) internal {
    // Approve tokens
    IERC20(_from).approve(DEX1_ERC20_PROXY_ADDRESS, _amount);

    // Swap tokens
    address(DEX1_EXCHANGE_ADDRESS).call.value(msg.value)(_calldataHexString);

    // Reset approval
    IERC20(_from).approve(DEX1_ERC20_PROXY_ADDRESS, 0);
  }

  // DEX 2 swap
  function Dex2Swap(address _from, address _to, uint256 _amount, uint256 _minReturn, bytes memory _calldataHexString) onlyOwner public payable {
    _Dex2Swap(_from, _to, _amount, _minReturn, _calldataHexString);
  }

  function _Dex2Swap(address _from, address _to, uint256 _amount, uint256 _minReturn, bytes memory _calldataHexString) internal {
    // Approve tokens
    IERC20(_from).approve(DEX2_ERC20_PROXY_ADDRESS, _amount);
    IERC20(_to).approve(DEX2_ERC20_PROXY_ADDRESS, _amount);

    // Swap tokens
    address(DEX2_EXCHANGE_ADDRESS).call.value(msg.value)(_calldataHexString);

    // Reset approval
    IERC20(_from).approve(DEX1_ERC20_PROXY_ADDRESS, 0);
    IERC20(_to).approve(DEX2_ERC20_PROXY_ADDRESS, 0);
  }

  // Approve / get gas token
  function getWeth() public payable onlyOwner {
    _getWeth(msg.value);
  }

  function _getWeth(uint256 _amount) internal {
    (bool success, ) = WETH.call.value(_amount)("");
    require(success, "failed to get Weth.");
  }

  function approveWeth(uint256 _amount) public onlyOwner {
    _approveWeth(_amount);
  }

  function _approveWeth(uint256 _amount) internal {
    IERC20(WETH).approve(DEX1_STAKING_PROXY, _amount);
  }

  // withdraw functions
  // IMPORTANT: KEEP THIS FUNCTION IN CASE CONTRACT RECEIVES TOKENS!
  function withdrawToken(address _tokenAddress) public onlyOwner {
    uint256 balance = IERC20(_tokenAddress).balanceOf(address(this));
    IERC20(_tokenAddress).transfer(OWNER, balance);
  }

  // KEEP THIS FUNCTION IN CASE CONTRACT KEEPS LEFTOVER ETHER!
  function withdrawEther() public onlyOwner {
    address self = address(this); // workaround for a possible solidity bug
    uint256 balance = self.balance;
    address(OWNER).transfer(balance); 
  }
}
