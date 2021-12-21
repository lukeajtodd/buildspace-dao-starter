import sdk from "./1-initialize-sdk.js"
import { ethers } from "ethers"
import { readFileSync } from "fs"

let tokenModule

try {
  const tokeModuleAddress = JSON.parse(readFileSync("src/config.json")).TOKEN_MODULE_ADDRESS
  tokenModule = sdk.getTokenModule(tokeModuleAddress)
} catch (err) {
  console.error("Issue getting tokenModule", err)
}

;(async () => {
  if (!tokenModule) return

  try {
    const amount = 1_000_000

    const amountWithDecimals = ethers.utils.parseUnits(amount.toString(), 18)

    await tokenModule.mint(amountWithDecimals)
    const totalSupply = await tokenModule.totalSupply()

    console.log(`There are now ${ethers.utils.formatUnits(totalSupply, 18)} $GENERIC in circulation.`)
  } catch (err) {
    console.error("Failed to mint governance token supply", err)
  }
})()