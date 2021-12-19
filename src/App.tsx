import React, { useEffect, useMemo, useState } from "react";
import { useWeb3 } from "@3rdweb/hooks";

const App = () => {
    const { connectWallet, address, provider, error } = useWeb3()
    console.log("Address: ", address)

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

    return (
      <div className="landing">
        <h1>We have a wallet!</h1>
      </div>
    )
}

export default App