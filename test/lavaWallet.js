const { expect } = require("chai");
const {
  defaultAbiCoder,
  parseEther,
  hexlify,
  toUtf8Bytes,
  joinSignature,
  formatBytes32String,
  SigningKey
} = require("ethers").utils;

const carlslarsonAddress = "0x95D9bED31423eb7d5B68511E0352Eae39a3CDD20"
const lavaWalletKovanAddress = "0xcaEE7DaA8C6f56Fa8DCdC5b77b2178DBc374e25C"
const tokenKovanAddress = "0x7B3A2c7D65c357fA4CCF4BA93d3C0781b843a4f3"
let carlslarsonSigner, account1, account2, token, tipping
const account1PrivateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"

beforeEach(async function() {
  [account1, account2] = await ethers.getSigners()
  await hre.network.provider.request({
    method: "hardhat_impersonateAccount",
    params: [carlslarsonAddress]
  })
  carlslarsonSigner = await ethers.provider.getSigner(carlslarsonAddress)
  token = await ethers.getContractAt("IERC20", tokenKovanAddress);
  await token.connect(carlslarsonSigner).transfer(account1.address, parseEther("1000"))

  const Tipping = await ethers.getContractFactory("Tipping")
  tipping = await Tipping.deploy(tokenKovanAddress);
})

describe("LavaWallet", function() {
  it("transferTokensWithSignature", async function() {
    const account1BalanceStart = await token.balanceOf(account1.address)
    const account2BalanceStart = await token.balanceOf(account2.address)

    const lavaWallet = await ethers.getContractAt("LavaWallet", lavaWalletKovanAddress);
    await token.connect(account1).approve(lavaWallet.address, ethers.constants.MaxUint256)
    const amount = parseEther("100")

    const digest = hexlify(
      await lavaWallet.getLavaTypedDataHash(
        toUtf8Bytes("transfer"),       //methodName
        ethers.constants.AddressZero,               //relayAuthority
        account1.address,                           //from
        account2.address,                           //to
        lavaWallet.address,                         //wallet (should be LavaWallet contract)
        tokenKovanAddress,                          //token
        amount,                                     //tokens
        0,                                          //relayerRewardTokens
        0,                                          //expires
        1)                                          //nonce
      )
    const account1SigningKey = new SigningKey(account1PrivateKey)
    const sig = joinSignature(account1SigningKey.signDigest(digest))
    await lavaWallet.transferTokensWithSignature(
      toUtf8Bytes("transfer"),       //methodName
      ethers.constants.AddressZero,               //relayAuthority
      account1.address,                           //from
      account2.address,                           //to
      tokenKovanAddress,                          //token
      amount,                                     //tokens
      0,                                          //relayerRewardTokens
      0,                                          //expires
      1,                                          //nonce
      sig)                                        //signature

    expect(await token.balanceOf(account1.address)).to.equal(account1BalanceStart.sub(amount))
    expect(await token.balanceOf(account2.address)).to.equal(account2BalanceStart.add(amount))
  });

  it("transferAndCallWithSignature", async function() {
    const token = await ethers.getContractAt("IERC20", tokenKovanAddress);
    const account1BalanceStart = await token.balanceOf(account1.address)
    const account2BalanceStart = await token.balanceOf(account2.address)

    const lavaWallet = await ethers.getContractAt("LavaWallet", lavaWalletKovanAddress);
    await token.connect(account1).approve(lavaWallet.address, ethers.constants.MaxUint256)
    const amount = parseEther("100")

    const methodName = defaultAbiCoder.encode(["address","string"],[account2.address, formatBytes32String("kf251b")])

    const digest = hexlify(
      await lavaWallet.getLavaTypedDataHash(
        methodName,                                 //methodName
        ethers.constants.AddressZero,               //relayAuthority
        account1.address,                           //from
        tipping.address,                            //to
        lavaWallet.address,                         //wallet (should be LavaWallet contract)
        tokenKovanAddress,                          //token
        amount,                                     //tokens
        0,                                          //relayerRewardTokens
        0,                                          //expires
        1)                                          //nonce
      )
    const account1SigningKey = new SigningKey(account1PrivateKey)
    const sig = joinSignature(account1SigningKey.signDigest(digest))
    await lavaWallet.transferAndCallWithSignature(
      methodName,                                 //methodName
      ethers.constants.AddressZero,               //relayAuthority
      account1.address,                           //from
      tipping.address,                            //to
      tokenKovanAddress,                          //token
      amount,                                     //tokens
      0,                                          //relayerRewardTokens
      0,                                          //expires
      1,                                          //nonce
      sig)                                        //signature

    // console.log(account2BalanceStart.toString())
    expect(await token.balanceOf(account1.address)).to.equal(account1BalanceStart.sub(amount))
    expect(await token.balanceOf(account2.address)).to.equal(account2BalanceStart.add(amount))
  });
});
