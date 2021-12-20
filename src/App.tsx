import React, { useEffect, useMemo, useState } from "react"
import { useWeb3 } from "@3rdweb/hooks"
import { ThirdwebSDK } from '@3rdweb/sdk'
import config from './config.json'

const sdk = new ThirdwebSDK("rinkeby")

const bundleDropModule = sdk.getBundleDropModule(
  config.BUNDLE_DROP_ADDRESS
)

const App = () => {
  const { connectWallet, address, provider, error } = useWeb3()

  const signer = provider ? provider.getSigner() : undefined

  const [hasClaimedNFT, setHasClaimedNFT] = useState(false)
  const [isClaiming, setIsClaiming] = useState(false)

  useEffect(() => {
    if (!signer) return
    sdk.setProviderOrSigner(signer)
  }, [signer])

  useEffect(() => {
    if (!address) {
      return
    }

    bundleDropModule
      // The "0" is the token id of the membership NFT
      .balanceOf(address, "0")
      .then(balance => {
        if (balance.gt(0)) {
          setHasClaimedNFT(true)
          console.log("Success! The user is a member.")
        } else {
          setHasClaimedNFT(false)
          console.log("The user is not a member.")
        }
      })
      .catch(error => {
        setHasClaimedNFT(false)
        console.error("Failed to get NFT balance", error)
      })
  }, [address])

  if (!address) {
    return (
      <div className="loading">
        <h1>Welcome to GenericDAO</h1>
        <button onClick={() => connectWallet("injected")} className="btn-hero">
          Connect
        </button>
      </div>
    )
  }

  if (hasClaimedNFT) {
    return (
      <div className="member-page">
        <h1>🍪DAO Member Page</h1>
        <p>Congratulations on being a member</p>
      </div>
    )
  }

  const mintNFT = () => {
    setIsClaiming(true)

    bundleDropModule
      .claim("0", 1)
      .catch(err => {
        console.error("Failed to claim NFT", err)
        setIsClaiming(false)
      })
      .finally(() => {
        setIsClaiming(false)
        setHasClaimedNFT(true)
        console.log(
          `Successfully minted a new membership NFT. View it on OpenSea: https://testnets.opensea.io/assets/${bundleDropModule.address}/0`
        )
      })
  }

  return (
    <div className="mint-nft">
      <h1>Mint your free DAO Membership NFT!</h1>
      <button
        disabled={isClaiming}
        onClick={() => mintNFT()}
      >
        {isClaiming ? "Minting..." : "Mint Your NFT (Free)"}
      </button>
    </div>
  )
}

export default App