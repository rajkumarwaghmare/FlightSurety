import FlightSuretyApp from "../../build/contracts/FlightSuretyApp.json";
import FlightSuretyData from "../../build/contracts/FlightSuretyData.json";
import Config from "./config.json";
import Web3 from "web3";
import express from "express";

let config = Config["localhost"];
let web3 = new Web3(
  new Web3.providers.WebsocketProvider(config.url.replace("http", "ws"))
);
web3.eth.defaultAccount = web3.eth.accounts[0];
let flightSuretyApp = new web3.eth.Contract(
  FlightSuretyApp.abi,
  config.appAddress
);
let flightSuretyData = new web3.eth.Contract(
  FlightSuretyData.abi,
  config.dataAddress
);
let oracles = [];

flightSuretyApp.events.OracleRequest(
  {
    fromBlock: 0,
  },
  function (error, event) {
    if (error) {
      console.log(error);
    } else {
      //let statusCode = Math.floor(Math.random() * 6) * 10; //Generate randomly from [0,10,20,30,40,50]
      let statusCode = 20; //STATUS_CODE_LATE_AIRLINE *** FOR TESTING PURPOSE ***
      let result = event.returnValues;
      console.log(
        `Serving Incoming OracleRequest: ${result.index} :  ${result.flight} : ${result.timestamp}`
      );
      oracles
        .filter((oracle) => oracle.indexes.includes(result.index))
        .forEach((oracle) => {
          oracle.indexes
            .filter((index) => index === result.index)
            .forEach((index) => {
              flightSuretyApp.methods
                .submitOracleResponse(
                  index,
                  result.airline,
                  result.flight,
                  result.timestamp,
                  statusCode
                )
                .send({
                  from: oracle.address,
                  gas: 4712388,
                  gasPrice: 100000000000,
                })
                .then((res) => {
                  console.log(
                    `OracleResponse: address(${oracle.address}) index(${index}) accepted[${statusCode}]`
                  );
                })
                .catch((err) => {
                  console.log(
                    `OracleResponse: address(${oracle.address}) index(${index}) rejected[${statusCode}]`
                  );
                });
            });
        });
    }
  }
);

//Register oracles
(async () => {
  let accounts = await web3.eth.getAccounts();
  await flightSuretyData.methods
    .authorizeCaller(config.appAddress)
    .send({ from: accounts[0] });
  let fee = await flightSuretyApp.methods.REGISTRATION_FEE().call();
  try {
    accounts.forEach(async (account) => {
      await flightSuretyApp.methods.registerOracle().send({
        from: account,
        value: fee,
        gas: 4712388,
        gasPrice: 100000000000,
      });
      let indices = await flightSuretyApp.methods.getMyIndexes().call({
        from: account,
      });
      oracles.push({
        address: account,
        indexes: indices,
      });
      console.log(
        `Oracle Registered: ${indices[0]}, ${indices[1]}, ${indices[2]}`
      );
    });
  } catch (e) {
    console.log(e);
  }
})();

const app = express();
app.get("/api", (req, res) => {
  res.send({
    message: "An API for use with your Dapp!",
  });
});

export default app;
