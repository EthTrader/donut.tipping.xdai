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

    function receiveTransfer(address _from, uint256 _amount, address _token, bytes calldata _data) public returns (bool success) {

        bytes4 funcId =
            _data[0] |
            (bytes4(_data[1]) >> 8) |
            (bytes4(_data[2]) >> 16) |
            (bytes4(_data[3]) >> 24);

        if(funcId == bytes4(keccak256("tip(address,string)"))) {
            require(_token == address(currency), ERROR_INVALID_TOKEN );

            (address recipientAddress, bytes32 contentId) = abi.decode(_data[4:], (address, bytes32));

            console.log("Tip recipient:", recipientAddress);

            emit Tip(_from, recipientAddress, _amount, contentId);

            require( currency.transfer(recipientAddress, _amount), ERROR_TOKEN_TRANSFER ) ;

            return true;
        } else {
            return false;
        }

    }

    function tip(address _to, uint _amount, bytes32 _contentId) external {
        require( currency.transferFrom(msg.sender, _to, _amount), ERROR_TOKEN_TRANSFER );

        emit Tip(msg.sender, _to, _amount, _contentId);
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
