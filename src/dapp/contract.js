import FlightSuretyApp from "../../build/contracts/FlightSuretyApp.json";
import FlightSuretyData from "../../build/contracts/FlightSuretyData.json";
import Config from "./config.json";
import Web3 from "web3";

export default class Contract {
  constructor(network, callback) {
    this.config = Config[network];
    this.web3 = new Web3(new Web3.providers.HttpProvider(this.config.url));
    this.flightSuretyApp = new this.web3.eth.Contract(
      FlightSuretyApp.abi,
      this.config.appAddress
    );
    this.flightSuretyData = new this.web3.eth.Contract(
      FlightSuretyData.abi,
      this.config.dataAddress
    );
    this.owner = null;
    this.airlines = [];
    this.passengers = [];
    this.initialize(callback);
  }

  initialize(callback) {
    this.web3.eth.getAccounts((error, accts) => {
      this.owner = accts[0];

      let counter = 1;

      while (this.airlines.length < 5) {
        this.airlines.push(accts[counter++]);
      }

      while (this.passengers.length < 5) {
        this.passengers.push(accts[counter++]);
      }
      callback();
    });
  }

  isOperational(callback) {
    let self = this;
    self.flightSuretyApp.methods
      .isOperational()
      .call({ from: self.owner }, callback);
  }

  fetchFlightStatus(flight, callback) {
    let self = this;
    let payload = {
      airline: self.airlines[0],
      flight: flight,
      timestamp: Math.floor(Date.now() / 1000),
    };
    self.flightSuretyApp.methods
      .fetchFlightStatus(payload.airline, payload.flight, payload.timestamp)
      .send({ from: self.owner }, (error, result) => {
        callback(error, payload);
      });
  }

  buyInsurance(flight, callback) {
    let self = this;
    console.log("Buying for passenger " + self.passengers[0]);
    console.log("Buying for flight " + flight);

    let payload = {
      flight: flight,
    };
    self.flightSuretyApp.methods
      .buy(payload.flight)
      .send({ from: self.passengers[0], value: 1e18 }, (error, result) => {
        callback(error, payload);
      });
  }

  getBalance(callback) {
    this.web3.eth.getBalance(this.passengers[0]).then(callback);
  }

  getContractBalance(callback) {
    this.web3.eth.getBalance(this.config.dataAddress).then(callback);
  }

  submitFunds() {
    let self = this;
    this.flightSuretyData.methods.fund().send({
      from: self.owner, //Contract owner who is first registsred airline will put 10 ethers funds itself
      value: 1e19, //send 10 ethers
    });
  }

  withdraw(callback) {
    let self = this;
    console.log("Withdrawing  for passenger " + self.passengers[0]);

    self.flightSuretyApp.methods
      .withdraw()
      .send({ from: self.passengers[0] }, (error, result) => {
        callback(error, result);
      });
  }

  getCredits(callback) {
    let self = this;
    console.log("Getting credits  for passenger " + self.passengers[0]);

    self.flightSuretyApp.methods
      .getCredits(self.passengers[0])
      .call({ from: self.owner }, callback);
  }
}
