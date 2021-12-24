import React, { useEffect, useMemo, useState } from "react"
import { useWeb3 } from "@3rdweb/hooks"
import { ThirdwebSDK, Proposal } from '@3rdweb/sdk'
import { ethers } from "ethers"

import config from './config.json'

const sdk = new ThirdwebSDK("rinkeby")

const bundleDropModule = sdk.getBundleDropModule(
  config.BUNDLE_DROP_ADDRESS
)

const tokenModule = sdk.getTokenModule(
  config.TOKEN_MODULE_ADDRESS
)

const voteModule = sdk.getVoteModule(
  config.VOTING_MODULE_ADDRESS
)

const App = () => {
  const { connectWallet, address, provider, error } = useWeb3()

  const signer = provider ? provider.getSigner() : undefined

  const [hasClaimedNFT, setHasClaimedNFT] = useState(false)
  const [isClaiming, setIsClaiming] = useState(false)
  const [memberTokenAmounts, setMemberTokenAmounts] = useState<Record<string, ethers.BigNumber>>({})
  const [memberAddresses, setMemberAddresses] = useState<string[]>([])
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [isVoting, setIsVoting] = useState(false)
  const [hasVoted, setHasVoted] = useState(false)

  const shortenAddress = (address: string) => {
    return address.substring(0, 6) + "..." + address.substring(address.length - 4)
  }

  useEffect(() => {
    if (!hasClaimedNFT) return

    voteModule
      .getAll()
      .then(proposals => {
        setProposals(proposals)
        console.log("Proposals: ", proposals)
      })
      .catch(err => {
        console.error("Failed to get proposals", err)
      })
  }, [hasClaimedNFT])

  useEffect(() => {
    if (!hasClaimedNFT) return

    if (!proposals.length) return

    voteModule
      .hasVoted(proposals[0].proposalId, address)
      .then(hasVoted => {
        setHasVoted(hasVoted)
        console.log("Use has already voted on this proposal")
      })
      .catch(err => {
        console.error("Failed to check if this wallet has voted", err)
      })
  }, [hasClaimedNFT, proposals, address])

  useEffect(() => {
    if (!hasClaimedNFT) return

    bundleDropModule
      .getAllClaimerAddresses("0")
      .then(addresses => {
        console.log("Member addresses: ", addresses)
        setMemberAddresses(addresses)
      })
      .catch(err => {
        console.error("Failed to get member addresses", err)
      })
  }, [hasClaimedNFT])

  useEffect(() => {
    if (!hasClaimedNFT) return

    tokenModule
      .getAllHolderBalances()
      .then(amounts => {
        console.log("Member token amounts: ", amounts)
        setMemberTokenAmounts(amounts)
      })
      .catch(err => {
        console.error("Failed to get member token amounts", err)
      })
  }, [hasClaimedNFT])

  const memberList = useMemo(() => {
    return memberAddresses.map(address => {
      return {
        address,
        tokenAmount: ethers.utils.formatUnits(memberTokenAmounts[address] || 0, 18)
      }
    })
  }, [memberAddresses, memberTokenAmounts])

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

  if (error && error.name === "UnsupportedChainIdError") {
    return (
      <div className="unsupported-network">
        <h2>Please connect to Rinkeby</h2>
        <p>
          This dapp only works on the Rinkeby network, please switch networks
          in your connected wallet.
        </p>
      </div>
    );
  }

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
        <h1>🍪DAO Boys</h1>
        <div>
          <div>
            <h2>Member List</h2>
            <table className="card">
              <thead>
                <tr>
                  <th>Address</th>
                  <th>Token Amount</th>
                </tr>
              </thead>
              <tbody>
                {memberList.map((member) => {
                  return (
                    <tr key={member.address}>
                      <td>{shortenAddress(member.address)}</td>
                      <td>{member.tokenAmount}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div>
            <h2>Active Proposals</h2>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                e.stopPropagation();

                //before we do async things, we want to disable the button to prevent double clicks
                setIsVoting(true);

                // lets get the votes from the form for the values
                const votes = proposals.map((proposal) => {
                  let voteResult = {
                    proposalId: proposal.proposalId,
                    //abstain by default
                    vote: 2,
                  };
                  proposal.votes.forEach((vote) => {
                    const elem: HTMLInputElement = (document.getElementById(
                      proposal.proposalId + "-" + vote.type
                    ) as HTMLInputElement);

                    if (elem && elem.checked) {
                      voteResult.vote = vote.type;
                      return;
                    }
                  });
                  return voteResult;
                });

                // first we need to make sure the user delegates their token to vote
                try {
                  //we'll check if the wallet still needs to delegate their tokens before they can vote
                  const delegation = await tokenModule.getDelegationOf(address);
                  // if the delegation is the 0x0 address that means they have not delegated their governance tokens yet
                  if (delegation === ethers.constants.AddressZero) {
                    //if they haven't delegated their tokens yet, we'll have them delegate them before voting
                    await tokenModule.delegateTo(address);
                  }
                  // then we need to vote on the proposals
                  try {
                    await Promise.all(
                      votes.map(async (vote) => {
                        // before voting we first need to check whether the proposal is open for voting
                        // we first need to get the latest state of the proposal
                        const proposal = await voteModule.get(vote.proposalId);
                        // then we check if the proposal is open for voting (state === 1 means it is open)
                        if (proposal.state === 1) {
                          // if it is open for voting, we'll vote on it
                          return voteModule.vote(vote.proposalId, vote.vote);
                        }
                        // if the proposal is not open for voting we just return nothing, letting us continue
                        return;
                      })
                    );
                    try {
                      // if any of the propsals are ready to be executed we'll need to execute them
                      // a proposal is ready to be executed if it is in state 4
                      await Promise.all(
                        votes.map(async (vote) => {
                          // we'll first get the latest state of the proposal again, since we may have just voted before
                          const proposal = await voteModule.get(
                            vote.proposalId
                          );

                          //if the state is in state 4 (meaning that it is ready to be executed), we'll execute the proposal
                          if (proposal.state === 4) {
                            return voteModule.execute(vote.proposalId);
                          }
                        })
                      );
                      // if we get here that means we successfully voted, so let's set the "hasVoted" state to true
                      setHasVoted(true);
                      // and log out a success message
                      console.log("successfully voted");
                    } catch (err) {
                      console.error("failed to execute votes", err);
                    }
                  } catch (err) {
                    console.error("failed to vote", err);
                  }
                } catch (err) {
                  console.error("failed to delegate tokens");
                } finally {
                  // in *either* case we need to set the isVoting state to false to enable the button again
                  setIsVoting(false);
                }
              }}
            >
              {proposals.map((proposal, index) => (
                <div key={proposal.proposalId} className="card">
                  <h5>{proposal.description}</h5>
                  <div>
                    {proposal.votes.map((vote) => (
                      <div key={vote.type}>
                        <input
                          type="radio"
                          id={proposal.proposalId + "-" + vote.type}
                          name={proposal.proposalId}
                          value={vote.type}
                          //default the "abstain" vote to chedked
                          defaultChecked={vote.type === 2}
                        />
                        <label htmlFor={proposal.proposalId + "-" + vote.type}>
                          {vote.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <button disabled={isVoting || hasVoted} type="submit">
                {isVoting
                  ? "Voting..."
                  : hasVoted
                    ? "You Already Voted"
                    : "Submit Votes"}
              </button>
              <small>
                This will trigger multiple transactions that you will need to
                sign.
              </small>
            </form>
          </div>
        </div>
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