//SPDX-License-Identifier: MIT
pragma solidity ^0.7.0;

import "hardhat/console.sol";

contract Tipping {
    IERC20 public currency;

    // Errors
    string private constant ERROR_TOKEN_TRANSFER = "TOKEN_TRANSFER_FAILED";
    string private constant ERROR_INVALID_TOKEN = "INVALID_TOKEN";

    event Tip(address from, address to, uint amount, bytes32 contentId);

    constructor(address _currency) {
        console.log("Deploying Tipping with currency:", _currency);
        currency = IERC20(_currency);
    }

    function receiveTransfer(address from, uint256 tokens, address token, bytes memory data) public returns (bool success) {

        address recipientAddress;
        bytes32 contentId;

        bytes32 metaDataOne;
        bytes32 metaDataTwo;

        (recipientAddress, contentId) = abi.decode(data, (address, bytes32));

        console.log("Tip recipient:", recipientAddress);

        emit Tip(from, recipientAddress, tokens, contentId);

        //This contract will have received the tokens so they will be transferred out to the final destination from here
        require( IERC20(token).transfer(recipientAddress, tokens) ) ;

        return true;

    }

}


abstract contract IERC20 {
    function totalSupply() public virtual view returns (uint);
    function balanceOf(address tokenOwner) public virtual view returns (uint balance);
    function allowance(address tokenOwner, address spender) public virtual view returns (uint remaining);
    function transfer(address to, uint tokens) public virtual returns (bool success);
    function approve(address spender, uint tokens) public virtual returns (bool success);
    function transferFrom(address from, address to, uint tokens) public virtual returns (bool success);

    event Transfer(address indexed from, address indexed to, uint tokens);
    event Approval(address indexed tokenOwner, address indexed spender, uint tokens);
}
