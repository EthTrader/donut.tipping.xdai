require("@nomiclabs/hardhat-waffle");
const {ALCHEMY_API_KEY} = require("./.secret")

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async () => {
  const accounts = await ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  networks: {
    hardhat: {
      forking: {
        url: `https://eth-kovan.alchemyapi.io/v2/${ALCHEMY_API_KEY}`,
        blockNumber: 23632675
      }
    }
  },
  solidity: {
    compilers: [
      {version: "0.5.17"},
      {version: "0.7.3"}
    ]
  }
};
