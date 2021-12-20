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
    if (!bundleDrop) return
    await bundleDrop.createBatch([
      {
        name: "Obscure Cube",
        description: "This NFT allows access to Generic DAO.",
        image: readFileSync('scripts/assets/generic.png')
      }
    ])

    console.log("Successfully created a new NFT in the drop!")
  } catch (err) {
    console.error("Failure when creating a new NFT for the drop", err)
  }
})()