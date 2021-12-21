import { ethers } from "ethers"
import { readFileSync } from "fs"
import sdk from "./1-initialize-sdk.js"

let bundleDrop

try {
  const config = JSON.parse(readFileSync("src/config.json"))
  bundleDrop = sdk.getBundleDropModule(
    config.BUNDLE_DROP_ADDRESS
  )
} catch (err) {
  console.error("Failed to set up bundleDrop", err)
}

let tokenModule

try {
  const tokeModuleAddress = JSON.parse(readFileSync("src/config.json")).TOKEN_MODULE_ADDRESS
  tokenModule = sdk.getTokenModule(tokeModuleAddress)
} catch (err) {
  console.error("Issue getting tokenModule", err)
}

;(async () => {
  try {
    const walletAddresses = await bundleDrop.getAllClaimerAddresses("0")

    if (walletAddresses.length === 0) {
      console.log("No one is a member currently.")
      process.exit(0)
    }

    const airdropTargets = walletAddresses.map(addr => {
      const randomAmount = Math.floor(Math.random() * (10000 - 1000 + 1) + 1000)
      console.log(`Going to airdrop ${randomAmount} of $GENERIC to ${addr}`)

      return {
        address: addr,
        amount: ethers.utils.parseUnits(randomAmount.toString(), 18)
      }
    })

    console.log("Starting batch airdrops")
    await tokenModule.transferBatch(airdropTargets)
    console.log("Successfully airdropped to all members.")
  } catch (err) {
    console.error("Failed to airdrop required tokens.", err)
  }
})()