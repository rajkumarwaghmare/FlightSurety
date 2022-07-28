# FlightSurety

FlightSurety is a sample application project for Udacity's Blockchain course.

## Install

This repository contains Smart Contract code in Solidity (using Truffle), tests (also using Truffle), dApp scaffolding (using HTML, CSS and JS) and server app scaffolding.

To install, download or clone the repo, then:

`npm install`
`truffle compile`

## Develop Client

To run truffle tests:

`truffle test ./test/flightSurety.js`
`truffle test ./test/oracles.js`

To use the dapp:

`truffle migrate`
`npm run dapp`

To view dapp:

`http://localhost:8000`

## Develop Server

`npm run server`
`truffle test ./test/oracles.js`

## Development Enviroment

| Tool     | Version                          |
| -------- | -------------------------------- |
| Truffle  | v5.1.14-nodeLTS.0 (core: 5.1.13) |
| Solidity | ^0.4.24 (solc-js)                |
| Node     | v16.13.2                         |
| web3     | ^1.5.2                           |

## Testing instructions

- Start ganache so that it generates 25 test accounts `ganache --accounts=25`
- Airline registration part can be tested using uni tests `truffle test ./test/flightSurety.js`
- Insurance purchase and account balance/credit confirmation can be done using UI of the dapp.

### Testing using dapp front end

- Balance of the data contract can be confirmed using `Display funds available with contract` button
- For a customer to be able to claim the amount, first data contact should have sufficient balance. It can be funded using `Fund this contract` button
- Buy the insurance using `Buy`buttom. User is fixed, flight can be selected.
- To fire Oracle request click `Submit to Oracles` button.
- After a custmer recieved amount due to delayed flight, credit can be confirmed using `Display my credit` button. Credit is the amount which is not yet sent to user but user can initiate the withdrawal
- User can initiate withdrawal by clicking `Withdraw my credits` button.
- If there are available credits then aften withdrawal, user can confirm the transfer by checking the balance using `Display my balance` button

## Deploy

To build dapp for prod:
`npm run dapp:prod`

Deploy the contents of the ./dapp folder

## Resources

- [How does Ethereum work anyway?](https://medium.com/@preethikasireddy/how-does-ethereum-work-anyway-22d1df506369)
- [BIP39 Mnemonic Generator](https://iancoleman.io/bip39/)
- [Truffle Framework](http://truffleframework.com/)
- [Ganache Local Blockchain](http://truffleframework.com/ganache/)
- [Remix Solidity IDE](https://remix.ethereum.org/)
- [Solidity Language Reference](http://solidity.readthedocs.io/en/v0.4.24/)
- [Ethereum Blockchain Explorer](https://etherscan.io/)
- [Web3Js Reference](https://github.com/ethereum/wiki/wiki/JavaScript-API)
