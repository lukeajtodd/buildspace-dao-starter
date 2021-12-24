import { ethers } from "ethers"
import sdk from "./1-initialize-sdk.js"
import { readFileSync } from "fs"

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
    const amount = 420_000

    await voteModule.propose(
      `Should the DAO mint an additional ${amount} tokens into the treasury?`,
      [
        {
          nativeTokenValue: 0,
          transactionData: tokenModule.contract.interface.encodeFunctionData(
            "mint",
            [
              voteModule.address,
              ethers.utils.parseUnits(amount.toString(), 18)
            ]
          ),
          toAddress: tokenModule.address
        }
      ]
    )

    console.log("Successfully created proposal to mint tokens!")
  } catch (err) {
    console.error("Failed to create first proposal", err)
    process.exit(1)
  }

  try {
    const amount = 6_900

    await voteModule.propose(
      `Should the DAO transfer ${amount} tokens to the user ${process.env.WALLET_ADDRESS} from the treasury? They are pretty awesome after all...`,
      [
        {
          nativeTokenValue: 0,
          transactionData: tokenModule.contract.interface.encodeFunctionData(
            "transfer",
            [
              process.env.WALLET_ADDRESS,
              ethers.utils.parseUnits(amount.toString(), 18)
            ]
          ),
          toAddress: tokenModule.address
        }
      ]
    )

    console.log("Successfully created a second proposal!")
  } catch (err) {
    console.error("Failed to create second proposal", err)
  }
})()