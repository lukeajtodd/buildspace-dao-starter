import { ethers } from "ethers"
import sdk from "./1-initialize-sdk.js"
import { readFileSync } from "fs";

(async () => {
  try {
    const apps = await sdk.getApps()
    console.log("App Address: ", apps[0].address)

    const app = sdk.getAppModule(apps[0].address)

    const bundleDropModule = await app.deployBundleDropModule({
      name: "GenericDAO Membership",
      description: "A generic DAO starter kit.",
      image: readFileSync("scripts/assets/generic.png"),
      // This can be an actual address if the NFTs are going to be purchasable for actual revenue.
      primarySaleRecipientAddress: ethers.constants.AddressZero
    })

    console.log("Successfully deployed bundleDrop module. Address: ", bundleDropModule.address)
    console.log("bundleDrop metadata: ", await bundleDropModule.getMetadata())

  } catch (err) {
    console.log("Failed to deploy bundleDrop module", err)
  }
})()