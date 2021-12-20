import sdk from "./1-initialize-sdk.js"
import { readFileSync } from "fs"

let bundleDrop

try {
  const config = JSON.parse(readFileSync("src/config.json"))
  bundleDrop = sdk.getBundleDropModule(
    config.BUNDLE_DROP_ADDRESS
  )
} catch (err) {
  console.error("Failed to set up bundleDrop", err)
}

;(async () => {
  try {
    if (!bundleDrop) console.error("No bundleDrop")
    const claimConditionFactory = bundleDrop.getClaimConditionFactory()
    claimConditionFactory.newClaimPhase({
      startTime: new Date(),
      maxQuantity: 50_000,
      maxQuantityPerTransaction: 1,
    })

    await bundleDrop.setClaimCondition(0, claimConditionFactory)
    console.log("Successfully set the claim conditions.")
  } catch (err) {
    console.error("Failed to set the claim conditions", err)
  }
})()