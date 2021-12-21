import { readFileSync } from "fs"
import sdk from "./1-initialize-sdk.js"

let appModule
let config

try {
  config = JSON.parse(readFileSync("src/config.json"))
  appModule = sdk.getAppModule(config.SDK_APP_ADDRESS)
} catch (err) {
  console.error("Failed to get the SDK app module", err)
}

;(async () => {
  if (!appModule) return

  try {
    const votingModule = await appModule.deployVoteModule({
      name: "GenericDAO Proposals",
      votingTokenAddress: config.TOKEN_MODULE_ADDRESS,
      proposalStartWaitTimeInSeconds: 0,
      // 24 hours to vote on the proposal
      proposalVotingTimeInSeconds: 24 * 60 * 60,
      votingQuorumFraction: 0,
      minimumNumberOfTokensNeededToPropose: "0"
    })

    console.log("Voting module successfully deployed: ", votingModule.address)
  } catch (err) {
    console.error("Failed to configure the voting system", err)
  }
})()