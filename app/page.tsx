'use client'

import React, { useState, useEffect } from "react"
import { ethers } from "ethers"
import { Framework } from '@superfluid-finance/sdk-core'
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

export default function Home() {
  const [currentAccount, setCurrentAccount] = useState("")
  const [profiles, setProfiles] = useState<any>([])
  const [flowRateDisplay, setFlowRateDisplay] = useState("")
  const [flowRate, setFlowRate] = useState("")
  const [recipient, setRecipient] = useState("")
  const [viewType, setViewType] = useState('base-followers')
  const [topProfiles, setTopProfiles] = useState<any>([])

  useEffect(() => {
    checkIfWalletIsConnected()
  }, [])

  async function fetchTopFollowers(account) {
    try {
      const profileId = await fetchProfileId(account)
      const data = await fetch('/api/lens-bigquery', {
        method: "POST",
        body: JSON.stringify({
          profileId
        })
      })
      const json = await data.json()
      if (json.data) {
        setTopProfiles(json.data)
      }
    } catch (err) {
      console.log('error fetching top followers...', err)
    }
  }

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
      fetchTopFollowers(accounts[0])
    } catch (error) {
      console.log(error)
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
      fetchTopFollowers(account)
    } else {
      console.log("No authorized account found")
    }
  }

  async function fetchProfileId(account) {
    try {
      let response = await client.query({
        query: getProfiles,
        variables: {
          addresses: [account]
        }
      })

      return response.data.profiles.items[0].id
    } catch (err) {
      console.log('error fetching profile id...', err)
    }
  }

  async function fetchFollowers(account) {
    try {
      const profileId = await fetchProfileId(account)
      const response = await client.query({
        query: getFollowers,
        variables: {
          profileId
        }
      })
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

  const topFollowers = viewType === 'top-followers'

  return (
    <main className="flex flex-col justify-between p-24">
      <h1>Superfluid X Lens</h1>
      {
        !currentAccount && (
          <button  onClick={connectWallet}
            className="mb-3 px-8 py-2 rounded-3xl bg-white text-black mt-2"
          >
            Connect Wallet
          </button>
        )
      }
      {
        currentAccount && (
          <p className="mt-3 mb-3">
            { currentAccount }
          </p>
        )
      }
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
      <div className="mt-3 mb-3">
        <button
        onClick={() => setViewType('base-followers')}
        className={`${!topFollowers ? 'bg-green-400' : 'bg-gray-200'} py-2 px-10 text-black`}>
          All Followers
        </button>
        <button
        onClick={() => setViewType('top-followers')}
        className={`${topFollowers ? 'bg-green-400' : 'bg-gray-200'} py-2 px-10 ml-1 text-black`}>
          Top Followers
        </button>
      </div>
      {
        viewType === 'base-followers' && profiles.map((profile, index) => (
          <div key={index} className="
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
      {
        viewType === 'top-followers' && topProfiles.map((profile, index) => (
          <div key={index} className="
          p-3 border-white border mt-4 border-slate-400	cursor-pointer
        "
        onClick={() => setRecipient(profile.owned_by)}
        >
              <img
                className="w-32 rounded-2xl"
                src={getGateway(profile.profile_picture_s3_url)}
              />
            <p className="mt-2 text-xl text-fuchsia-400">@{profile.handle}</p>
            <p>{profile.name}</p>
        </div>
        ))
      }
    </main>
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
