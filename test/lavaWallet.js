const { expect } = require("chai");
const { TypedDataUtils } = require('ethers-eip712')

const carlslarsonAddress = "0x95D9bED31423eb7d5B68511E0352Eae39a3CDD20"
const relayAddress = "0x99a848F6d8bb6D6Cd1A524B3C99a97e41e1E4b5A"
const lavaWalletKovanAddress = "0xcaEE7DaA8C6f56Fa8DCdC5b77b2178DBc374e25C"
const tokenKovanAddress = "0x7B3A2c7D65c357fA4CCF4BA93d3C0781b843a4f3"
let carlslarsonSigner, relaySigner, account1, account2, token

beforeEach(async function() {
  [account1, account2] = await ethers.getSigners()
  await hre.network.provider.request({
    method: "hardhat_impersonateAccount",
    params: [carlslarsonAddress]
  })
  await hre.network.provider.request({
    method: "hardhat_impersonateAccount",
    params: [relayAddress]
  })
  carlslarsonSigner = await ethers.provider.getSigner(carlslarsonAddress)
  relaySigner = await ethers.provider.getSigner(relaySigner)
  token = await ethers.getContractAt("IERC20", tokenKovanAddress, carlslarsonSigner);
  await token.transfer(account1.address, ethers.utils.parseEther("1000"))
  console.log(`account1 has: ${ethers.utils.formatEther(await token.balanceOf(account1.address))}`)
  console.log(`account2 has: ${ethers.utils.formatEther(await token.balanceOf(account2.address))}`)
})

describe("LavaWallet", function() {
  it("transferTokensWithSignature", async function() {
    const token = await ethers.getContractAt("IERC20", tokenKovanAddress);
    // const lavaWallet = await ethers.getContractAt("LavaWallet", lavaWalletKovanAddress);
    const LavaWallet = await ethers.getContractFactory("LavaWallet");
    let lavaWallet = await LavaWallet.deploy(42);
    await lavaWallet.deployed();
    await token.approve(lavaWallet.address, ethers.constants.MaxUint256)
    const amount = ethers.utils.parseEther("100")
    const digest = await lavaWallet.getLavaTypedDataHash(
      ethers.utils.toUtf8Bytes("transfer"),       //methodName
      ethers.constants.AddressZero,               //relayAuthority
      account1.address,                           //from
      account2.address,                           //to
      lavaWallet.address,                         //wallet (should be LavaWallet contract)
      tokenKovanAddress,                          //token
      amount,                                     //tokens
      0,                                          //relayerRewardTokens
      0,                                          //expires
      1)                                          //nonce
    const digestHex = ethers.utils.hexlify(digest)
    const sig = await account1.signMessage(digestHex)

    // const typedData = {
    //   types: {
    //     EIP712Domain: [
    //       {name: "name", type: "string"},
    //       {name: "version", type: "string"},
    //       {name: "chainId", type: "uint256"},
    //       {name: "verifyingContract", type: "address"},
    //     ],
    //     LavaPacket: [
    //       { name: 'methodName', type: 'bytes'},
    //       { name: 'relayAuthority', type: 'address'},
    //       { name: 'from', type: 'address'},
    //       { name: 'to', type: 'address'},
    //       { name: 'wallet', type: 'address'},
    //       { name: 'token', type: 'address'},
    //       { name: 'tokens', type: 'uint256'},
    //       { name: 'relayerRewardTokens', type: 'uint256'},
    //       { name: 'expires', type: 'uint256'},
    //       { name: 'nonce', type: 'uint256'}
    //     ]
    //   },
    //   primaryType: 'LavaPacket',
    //   domain: {
    //     name: 'Lava Wallet',
    //     version: '1',
    //     chainId: 42,
    //     verifyingContract: lavaWallet.address
    //   },
    //   message: {
    //     methodName: ethers.utils.toUtf8Bytes("transfer"),
    //     relayAuthority: ethers.constants.AddressZero,
    //     from: account1.address,
    //     to: account2.address,
    //     wallet: lavaWallet.address,
    //     token: tokenKovanAddress,
    //     tokens: amount,
    //     relayerRewardTokens: 0,
    //     expires: 0,
    //     nonce: 1
    //   }
    // }
    // const digest = TypedDataUtils.encodeDigest(typedData)
    // const digestHex = ethers.utils.hexlify(digest)
    // console.log("digestHex", digestHex)
    // const sig = await account1.signMessage(digestHex)
    // const recover = ethers.utils.verifyMessage(digest, sig)
    // console.log("sig:", sig)
    // console.log("recover:", recover)
    // console.log("correct signer:", account1.address == recover)


    // const domain = {
    //   name: 'Lava Wallet',
    //   version: '1',
    //   chainId: 42,
    //   verifyingContract: lavaWallet.address
    // }
    // const types = {
    //   LavaPacket: [
    //     { name: 'methodName', type: 'bytes'},
    //     { name: 'relayAuthority', type: 'address'},
    //     { name: 'from', type: 'address'},
    //     { name: 'to', type: 'address'},
    //     { name: 'wallet', type: 'address'},
    //     { name: 'token', type: 'address'},
    //     { name: 'tokens', type: 'uint256'},
    //     { name: 'relayerRewardTokens', type: 'uint256'},
    //     { name: 'expires', type: 'uint256'},
    //     { name: 'nonce', type: 'uint256'}
    //   ]
    // }
    // const value = {
    //   methodName: ethers.utils.toUtf8Bytes("transfer"),
    //   relayAuthority: ethers.constants.AddressZero,
    //   from: account1.address,
    //   to: account2.address,
    //   wallet: lavaWallet.address,
    //   token: tokenKovanAddress,
    //   tokens: amount,
    //   relayerRewardTokens: 0,
    //   expires: 0,
    //   nonce: 1
    // }
    // const sig2 = await account1._signer._signTypedData(domain, types, value)
    // console.log("sig2:", sig2)
    // console.log("from:", account1.address)
    const valid = await lavaWallet.signatureIsValid(
      ethers.utils.toUtf8Bytes("transfer"),       //methodName
      ethers.constants.AddressZero,               //relayAuthority
      account1.address,                           //from
      account2.address,                           //to
      lavaWallet.address,                         //wallet (should be LavaWallet contract)
      tokenKovanAddress,                          //token
      amount,                                     //tokens
      0,                                          //relayerRewardTokens
      0,                                          //expires
      1,                                          //nonce
      sig)                                        //signature

    expect(valid).to.be.true
    // console.log(`account1 has: ${ethers.utils.formatEther(await token.balanceOf(account1.address))}`)
    // console.log(`account2 has: ${ethers.utils.formatEther(await token.balanceOf(account2.address))}`)
  });
});
