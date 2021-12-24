import sdk from "./1-initialize-sdk.js"
import { readFileSync } from "fs"

let tokenModule

try {
  const tokenModuleAddress = JSON.parse(readFileSync("src/config.json")).TOKEN_MODULE_ADDRESS
  tokenModule = sdk.getTokenModule(tokenModuleAddress)
} catch (err) {
  console.error("Issue getting tokenModule", err)
}

;(async () => {
  try {
    console.log(
      "Roles that exists right now: ",
      await tokenModule.getAllRoleMembers()
    )

    await tokenModule.revokeAllRolesFromAddress(process.env.WALLET_ADDRESS)
    console.log(
      "Roles aafter revoking: ",
      await tokenModule.getAllRoleMembers()
    )

    console.log("Successfully revoked our role in the DAO")
  } catch (err) {
    console.error("Failed to revoke the minting role from address", err)
  }
})()