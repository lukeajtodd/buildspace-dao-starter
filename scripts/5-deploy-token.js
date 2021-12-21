import sdk from "./1-initialize-sdk.js"
import { readFileSync } from "fs"

let app

try {
  const config = JSON.parse(readFileSync("src/config.json"))
  app = sdk.getAppModule(config.SDK_APP_ADDRESS)
} catch (err) {
  console.error("Failed to configure app", err)
}

;(async () => {
  if (!app) return

  try {
    const tokenModule = await app.deployTokenModule({
      name: "Generic DAO Governance Token",
      symbol: "GENERIC"
    })

    console.log("Successfully created governance token: ", tokenModule.address)
  } catch (err) {
    console.error("Failed to create governance token", err)
  }
})()