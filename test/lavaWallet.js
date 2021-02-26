const { expect } = require("chai");
const {
  defaultAbiCoder,
  parseEther,
  hexlify,
  toUtf8Bytes,
  joinSignature,
  formatBytes32String,
  Interface,
  SigningKey
} = require("ethers").utils;

const networkData = {
  kovan: {
    chainId: 42,
    lavaWalletAddress: "0xcaEE7DaA8C6f56Fa8DCdC5b77b2178DBc374e25C",
    tokenAddress: "0x7B3A2c7D65c357fA4CCF4BA93d3C0781b843a4f3",
  },
  xdai: {
    chainId: 100,
    lavaWalletAddress: "0x99bbB6034D394C7b4A96827Dc35eA573DE4D8883",
    tokenAddress: "0x524B969793a64a602342d89BC2789D43a016B13A",
    tippingAddress: "0xF40e98033eb722CC6B4a64F7b37737d56eCB17EF"
  }
}
const NETWORK = networkData.xdai

const carlslarsonAddress = "0x95D9bED31423eb7d5B68511E0352Eae39a3CDD20"
let carlslarsonSigner, account1, account2, token, tipping
const account1PrivateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"

beforeEach(async function() {
  [account1, account2] = await ethers.getSigners()
  await hre.network.provider.request({
    method: "hardhat_impersonateAccount",
    params: [carlslarsonAddress]
  })
  carlslarsonSigner = await ethers.provider.getSigner(carlslarsonAddress)

  tipping = await ethers.getContractAt("Tipping", NETWORK.tippingAddress);
  lavaWallet = await ethers.getContractAt("LavaWallet", NETWORK.lavaWalletAddress);
  token = await ethers.getContractAt("IERC20", NETWORK.tokenAddress);
  await token.connect(carlslarsonSigner).transfer(account1.address, parseEther("1000"))

  // const Tipping = await ethers.getContractFactory("Tipping")
  // tipping = await Tipping.deploy(NETWORK.tokenAddress);
  // tipping = await Tipping.deploy();
})

describe("LavaWallet", function() {
  it("transferTokensWithSignature", async function() {
    const account1BalanceStart = await token.balanceOf(account1.address)
    const account2BalanceStart = await token.balanceOf(account2.address)

    await token.connect(account1).approve(lavaWallet.address, ethers.constants.MaxUint256)
    const amount = parseEther("100")

    const digest = hexlify(
      await lavaWallet.getLavaTypedDataHash(
        toUtf8Bytes("transfer"),       //methodName
        ethers.constants.AddressZero,               //relayAuthority
        account1.address,                           //from
        account2.address,                           //to
        lavaWallet.address,                         //wallet (should be LavaWallet contract)
        NETWORK.tokenAddress,                          //token
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
      NETWORK.tokenAddress,                          //token
      amount,                                     //tokens
      0,                                          //relayerRewardTokens
      0,                                          //expires
      1,                                          //nonce
      sig)                                        //signature

    expect(await token.balanceOf(account1.address)).to.equal(account1BalanceStart.sub(amount))
    expect(await token.balanceOf(account2.address)).to.equal(account2BalanceStart.add(amount))
  });

  it("transferAndCallWithSignature", async function() {
    const token = await ethers.getContractAt("IERC20", NETWORK.tokenAddress);
    const account1BalanceStart = await token.balanceOf(account1.address)
    const account2BalanceStart = await token.balanceOf(account2.address)

    await token.connect(account1).approve(lavaWallet.address, ethers.constants.MaxUint256)
    const amount = parseEther("100")

    var iface = new Interface(["function tip(address,string)"])
    // var funcId = iface.getSighash('tip');
    // console.log("funcId",funcId)
    const methodName = iface.encodeFunctionData('tip', [account2.address, formatBytes32String("kf251b")])

    const digest = hexlify(
      await lavaWallet.getLavaTypedDataHash(
        methodName,                                 //methodName
        ethers.constants.AddressZero,               //relayAuthority
        account1.address,                           //from
        tipping.address,                            //to
        lavaWallet.address,                         //wallet (should be LavaWallet contract)
        NETWORK.tokenAddress,                          //token
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
      NETWORK.tokenAddress,                          //token
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
