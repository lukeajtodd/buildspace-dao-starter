import { ethers } from "ethers"
import { readFileSync } from "fs"
import sdk from "./1-initialize-sdk.js"

let tokenModule

try {
  const tokenModuleAddress = JSON.parse(readFileSync("src/config.json")).TOKEN_MODULE_ADDRESS
  tokenModule = sdk.getTokenModule(tokenModuleAddress)
} catch (err) {
  console.error("Issue getting tokenModule", err)
}

let voteModule

try {
  const votingModuleAddress = JSON.parse(readFileSync("src/config.json")).VOTING_MODULE_ADDRESS
  voteModule = sdk.getVoteModule(votingModuleAddress)
} catch (err) {
  console.error("Issue getting votingModule", err)
}

;(async () => {
  if (!tokenModule && !voteModule) return

  try {
    await tokenModule.grantRole("minter", voteModule.address)

    console.log("Successfully gave voting module permissions to mint tokens.")
  } catch (err) {
    console.error("Issue setting up permissions on voting module", err)
    process.exit(0)
  }

  try {
    const ownedTokenBalance = await tokenModule.balanceOf(
      process.env.WALLET_ADDRESS
    )

    const amount = ethers.BigNumber.from(ownedTokenBalance.value)
    const ninetyPercent = amount.div(100).mul(90)

    await tokenModule.transfer(
      voteModule.address,
      ninetyPercent
    )

    console.log("Successfully transferred tokens to treasury.")
  } catch (err) {
    console.error("Failed to transfer tokens to treasury", err)
  }
})()