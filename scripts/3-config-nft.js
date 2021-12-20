import sdk from "./1-initialize-sdk"
import { readFileSync } from "fs"

const bundleDrop = sdk.getBundleDropModule()

;(async => {
  try {
    await bundleDrop.createBatch([
      {
        name: "Obscure Cube",
        description: "This NFT allows access to Generic DAO.",
        image: readFileSync('./assets/generic.png') 
      }
    ])

    console.log("Successfully created a new NFT in the drop!")
  } catch (err) {
    console.error("Failure when creating a new NFT for the drop", err)
  }
})()