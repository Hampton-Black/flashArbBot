require('dotenv').config();
require('console.table');
const express = require('express');
const path = require('path');
const player = require('play-sound')(opts = {});
const http = require('http');
const cors = require('cors');
const Web3 = require('web3');
const axios = require('axios');
const moment = require('moment-timezone');
const numeral = require('numeral');
const _ = require('lodash');

// SERVER CONFIG
const PORT = process.env.PORT || 5000;
const app = express();
const server = http.createServer(app).listen(PORT, () => console.log(`Listening on ${ PORT }`));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors({credentials: true, origin: '*'}));

// WEB3 CONFIG
const web3 = new Web3(process.env.RPC_URL);
web3.eth.accounts.wallet.add(process.env.PRIVATE_KEY);

// SMART CONTRACTS
// ABI, contract address, then web3.eth.Contract()

// EXCHANGE NAMES

// ASSET SYMBOLS
const DAI = 'DAI';
const WETH = 'WETH';
const AVAX = 'AVAX';
const USDC = 'USDC';
// etc.

// ASSET ADDRESSES
const ASSET_ADDRESSES = {
  DAI: '0x...',
  WETH: '',
  AVAX: '',
  USDC: ''
}

// DISPLAY LOGIC
tokensWithDecimalPlaces = (amount, symbol) => {  // is syntax correct here?
  amount = amount.toString();
  switch (symbol) {
    case DAI: // 18 decimals
      return web3.utils.fromWei(amount, 'ether');
    default:
      return web3.utils.fromWei(amount, 'ether');
  }
}

const TOKEN_DISPLAY_DECIMALS = 2; // show 2 decimal places
const displayTokens = (amount, symbol) => {
  let tokens;
  tokens = tokensWithDecimalPlaces(amount, symbol);
  return(tokens);
}

// UTILITIES
const now = () => (moment().tz('America/New York').format());

const SOUND_FILE = 'ding.mp3';
const playSound = () => {
  player.play(SOUND_FILE, function(err) {
    if(err) {
      console.log("Error playing sound!");
    }
  });
}

// FORMATTER
const toTokens = (tokenAmount, symbol) => {
  switch(symbol) {
    case DAI: // 18 decimals
      return web3.utils.toWei(tokenAmount, 'Ether');
    case USDC: // 6 decimals
      return web3.utils.fromWei(web3.utils.toWei(tokenAmount), 'szabo');
  }
}

// TRADING FUNCTION WITH DEX1 (needed?)

// CHECK TO SEE IF ORDER CAN BE ARBITRAGED
async function checkArb(args) {
  let profitableArbFound = false;
  const { DexOrder, metadata, assetOrder } = args;
  // this becomes the input amount
  let inputAssetAmount = dexOrder.takerAssetAmount; // make sense?

  const dex2Data = await fetchDex2Data();
  // this becomes the outputAssetAmount
  const outputAssetAmount = dex2Data.returnAmount;

  // calculate estimated gas cost
  let estimatedGasFee = process.env.ESTIMATED_GAS.toString() * web3.utils.toWei(process.env.GAS_PRICE.toString(), 'Gwei');

  // calculate slippage
  let slippage = '0.995';
  const minReturn = dexData.returnAmount;
  const minReturnWithSlippage = minReturnWithSlippage = (new web3.utils.BN(minReturn)).mul(new web3.utils.BN('995')).div(new web3.utils.BN('1000')).toString();


  let netProfit;
  // calculate net Profit
  netProfit = Math.floor(outputAssetAmount - inputAssetAmount - estimatedGasFee - minReturnWithSlippage);

  // determine if profitable
  const profitable = netProfit > (1.09 * flashAmount);

  if(profitable) {
    console.log(dexOrder);
    profitableArbFound = true;

    // play alert tone
    playSound();

    // log the arb
    console.table([{
      'Profitable?': profitable,
      'Asset Order': assetOrder.join(', '),
      'Exchange Order': 'Dexs ...',
      'Input': displayTokens(inputAssetAmount, assetOrder[0]).padEnd(22, ' '),
      'Output': displayTokens(outputAssetAmount, assetOrder[0]).padEnd(22, ' '),
      'Profit': displayTokens(netProfit.toString(), assetOrder[0]).padEnd(22, ' '),
      'Timestamp': now(),
    }]);

    // call arb contract
    await trade();
  }
}

// TRADE EXECUTION
async function trade(flashTokenSymbol, flashTokenAddress, arbTokenAddress, orderJson, fillAmount, oneSplitData) {
  const FLASH_AMOUNT = toTokens('10000', flashTokenSymbol); // 10,000 WETH
  const FROM_TOKEN = flashTokenAddress; // WETH
  const FROM_AMOUNT = fillAmount; // '1000000'
  const TO_TOKEN = arbTokenAddress;

  // DEX call data

  // perform trade
  receipt = await traderContract.methods.myFlashLoanCall(
    flashTokenAddress,
    FLASH_AMOUNT
  ).send({
    from: process.env.ADDRESS,
    gas: process.env.GAS_LIMIT,
    gasPrice: web3.utils.toWei(process.env.GAS_PRICE, 'Gwei')
  });
  console.log(receipt);
}

// FETCH ORDERBOOK

// CHECK MARKETS
let checkingMarkets = false;
async function checkMarkets() {
  if(checkingMarkets) {
    return;
  }

  console.log(`Fetching market data @ ${now()} ... \n`);
  checkingMarkets = true;

  try {
    await checkOrderBook(WETH, DAI);
    await checkOrderBook(DAI, WETH);
    await checkOrderBook(USDC, WETH); // etc.
  } catch(error) {
    console.error(error);
    checkingMarkets = false;
    return;
  }

  checkingMarkets = false;
}

// Check markets every n seconds
const POLLING_INTERVAL = process.env.POLLING_INTERVAL || 3000; // 3 seconds
const marketChecker = setInterval(async () => { await checkMarkets() }, POLLING_INTERVAL);
