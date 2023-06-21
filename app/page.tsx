'use client'

import { Framework } from '@superfluid-finance/sdk-core'
import { ethers } from "ethers"
import React, { useState, useEffect } from "react"
import { client, getProfiles, getFollowers } from '../api'

declare global {
  interface Window{
    ethereum?:any
  }
}

async function createNewFlow(recipient, flowRate) {
  const provider = new ethers.providers.Web3Provider(window.ethereum)
  await provider.send("eth_requestAccounts", [])
  const signer = provider.getSigner()

  const sf = await Framework.create({
    chainId: 137,
    provider: provider
  })
  const superSigner = sf.createSigner({ signer: signer })
  const maticx = await sf.loadSuperToken("MATICx")

  console.log(maticx)

  try {
    const createFlowOperation = maticx.createFlow({
      sender: await superSigner.getAddress(),
      receiver: recipient,
      flowRate: flowRate
    })

    console.log(createFlowOperation)
    console.log("Creating your stream...")

    const result = await createFlowOperation.exec(superSigner)
    console.log(result)

    console.log(
      `Congrats - you've just created a money stream!
    `
    )
  } catch (error) {
    console.log("Error: ", error)
    console.error(error)
  }
}

export default function CreateFlow () {
  const [recipient, setRecipient] = useState("")
  const [flowRate, setFlowRate] = useState("")
  const [flowRateDisplay, setFlowRateDisplay] = useState("")
  const [currentAccount, setCurrentAccount] = useState("")
  const [profiles, setProfiles] = useState<any>([])

  useEffect(() => {
    checkIfWalletIsConnected()
  }, [])

  const connectWallet = async () => {
    try {
      const { ethereum } = window
      if (!ethereum) {
        alert("Get MetaMask!")
        return
      }
      const accounts = await ethereum.request({
        method: "eth_requestAccounts"
      })
      console.log("Connected", accounts[0])
      setCurrentAccount(accounts[0])
      fetchFollowers(accounts[0])
    } catch (error) {
      console.log(error)
    }
  }

  async function fetchFollowers(account) {
    try {
      let response = await client.query({
        query: getProfiles,
        variables: {
          addresses: [account]
        }
      })

      const profileId = response.data.profiles.items[0].id
      
      response = await client.query({
        query: getFollowers,
        variables: {
          profileId
        }
      })
      console.log('response: ', response)
      let profileData = response.data.followers.items.filter(profile => {
        if (profile.wallet.defaultProfile) {
          return true
        } else {
          return false
        }
      })
      profileData = profileData.map(p => {
        return {
          ...p.wallet.defaultProfile,
          address: p.wallet.address
        }
      }).filter(p => p.picture)
      console.log('profileData:', profileData)
      setProfiles(profileData)
    } catch (err) {
      console.log('error getting followers:', err)
    }
  }

  const checkIfWalletIsConnected = async () => {
    const { ethereum } = window

    if (!ethereum) {
      console.log("Make sure you have metamask!")
      return
    } else {
      console.log("We have the ethereum object", ethereum)
    }

    const accounts = await window.ethereum.request({ method: "eth_accounts" })
    if (accounts.length !== 0) {
      const account = accounts[0]
      console.log("Found an authorized account:", account)
      setCurrentAccount(account)
      fetchFollowers(account)
    } else {
      console.log("No authorized account found")
    }
  }

  function calculateFlowRate(amount) {
    if (Number(amount) === 0) {
      return 0
    }
    const amountInWei = ethers.BigNumber.from(amount)
    const monthlyAmount = ethers.utils.formatEther(amountInWei.toString())
    // @ts-ignore
    const calculatedFlowRate = monthlyAmount * 3600 * 24 * 30
    return calculatedFlowRate
  }

  const handleRecipientChange = (e) => {
    setRecipient(() => ([e.target.name] = e.target.value))
  }

  const handleFlowRateChange = (e) => {
    setFlowRate(() => ([e.target.name] = e.target.value))
    let newFlowRateDisplay = calculateFlowRate(e.target.value)
    if (newFlowRateDisplay) {
      setFlowRateDisplay(newFlowRateDisplay.toString())
    }
  }

  return (
    <div className="p-12">
      <h2 className="text-4xl">Create a Flow</h2>
      {currentAccount === "" ? (
        <button  onClick={connectWallet}
          className="px-8 py-2 rounded-3xl bg-white text-black mt-2"
        >
          Connect Wallet
        </button>
      ) : (
        <p className="mt-3 mb-3">
          { currentAccount }
        </p>
      )}
      <div className="flex flex-col items-start">
        <input
          value={recipient}
          placeholder="Enter recipient address"
          onChange={handleRecipientChange}
          className='text-black py-1 px-2 mb-2 w-72'
        />
        <input
          value={flowRate}
          onChange={handleFlowRateChange}
          placeholder="Enter a flowRate in wei/second"
          className='text-black py-1  px-2 w-72'
        />
        <button
          className="px-8 py-2 rounded-3xl bg-white text-black mt-2"
          onClick={() => {
            createNewFlow(recipient, flowRate)
          }}
        >
          Click to Create Your Stream
        </button>
        <a className="mt-4 text-green-400" href="https://app.superfluid.finance/" target="_blank" rel='no-opener'>View Superfluid Dashboard</a>
      </div>

      <div className="border-green-400 border p-4 mt-3">
        <p>Your flow will be equal to:</p>
        <p>
          <b>${flowRateDisplay !== " " ? flowRateDisplay : 0}</b> Maticx/month
        </p>
      </div>
      {
        profiles.map(profile => (
          <div key={profile.address} className="
            p-3 border-white border mt-4 border-slate-400	cursor-pointer
          "
          onClick={() => setRecipient(profile.address)}
          >
            {
              profile.picture?.original?.url && (
                <img
                  className="w-32 rounded-2xl"
                  src={getGateway(profile.picture?.original?.url)}
                />
              )
            }
            {
              profile.picture?.url && (
                <img
                  className="w-32 rounded-2xl"
                  src={getGateway(profile.picture.url)}
                />
              )
            }
            {
              profile.picture?.uri && (
                <img
                  className="w-32 rounded-2xl"
                  src={getGateway(profile.picture.uri)}
                />
              )
            }
            <p className="mt-2 text-xl text-fuchsia-400">@{profile.handle}</p>
            <p>{profile.name}</p>
          </div>
        ))
      }
    </div>
  )
}

function getGateway(hashoruri) {
  if (hashoruri.includes('https')) {
    return hashoruri
  }
  if (hashoruri.includes('ipfs://')) {
    console.log("ipfs: ", hashoruri.replace('ipfs://', 'https://ipfs.io/ipfs/'))
    return hashoruri.replace('ipfs://', 'https://ipfs.io/ipfs/')
  }
  if (hashoruri.includes('ar://')) {
    console.log('ar: ', hashoruri.replace('ar://', 'https://arweave.net/'))
    return hashoruri.replace('ar://', 'https://arweave.net/')
  }
} 
