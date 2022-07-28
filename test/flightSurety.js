var Test = require("../config/testConfig.js");
var BigNumber = require("bignumber.js");

contract("Flight Surety Tests", async (accounts) => {
  var config;
  before("setup contract", async () => {
    config = await Test.Config(accounts);
    await config.flightSuretyData.authorizeCaller(
      config.flightSuretyApp.address
    );
  });

  /****************************************************************************************/
  /* Operations and Settings                                                              */
  /****************************************************************************************/

  it(`(multiparty) has correct initial isOperational() value`, async function () {
    // Get operating status
    let status = await config.flightSuretyData.isOperational.call();
    assert.equal(status, true, "Incorrect initial operating status value");
  });

  it(`(multiparty) can block access to setOperatingStatus() for non-Contract Owner account`, async function () {
    // Ensure that access is denied for non-Contract Owner account
    let accessDenied = false;
    try {
      await config.flightSuretyData.setOperatingStatus(false, {
        from: config.testAddresses[2],
      });
    } catch (e) {
      accessDenied = true;
    }
    assert.equal(accessDenied, true, "Access not restricted to Contract Owner");
  });

  it(`(multiparty) can allow access to setOperatingStatus() for Contract Owner account`, async function () {
    // Ensure that access is allowed for Contract Owner account
    let accessDenied = false;
    try {
      await config.flightSuretyData.setOperatingStatus(false);
    } catch (e) {
      accessDenied = true;
    }
    assert.equal(
      accessDenied,
      false,
      "Access not restricted to Contract Owner"
    );
  });

  it(`(multiparty) can block access to functions using requireIsOperational when operating status is false`, async function () {
    await config.flightSuretyData.setOperatingStatus(false);

    let reverted = false;
    try {
      await config.flightSurety.setTestingMode(true);
    } catch (e) {
      reverted = true;
    }
    assert.equal(reverted, true, "Access not blocked for requireIsOperational");

    // Set it back for other tests to work
    await config.flightSuretyData.setOperatingStatus(true);
  });

  it("(airline) cannot register an Airline using registerAirline() if it is not funded", async () => {
    // ARRANGE
    let newAirline = accounts[2];

    // ACT
    try {
      await config.flightSuretyApp.registerAirline(newAirline, {
        from: config.firstAirline,
      });
    } catch (e) {}
    let result = await config.flightSuretyData.isRegisteredAirLine.call(
      newAirline
    );

    // ASSERT
    assert.equal(
      result,
      false,
      "Airline should not be able to register another airline if it hasn't provided funding"
    );
  });

  it("(airline) can register an Airline using registerAirline() if it is funded", async () => {
    // ARRANGE
    let newAirline = accounts[2];

    // ACT
    try {
      await config.flightSuretyData.registerAirline(config.firstAirline); //Register first airline
      await config.flightSuretyData.fund({
        from: config.firstAirline, //First airline funds itself
        value: config.weiMultiple * 10, //send 10 ethers
      });
      await config.flightSuretyData.registerAirline(newAirline, {
        from: config.firstAirline, //First airline registers newAirline
      });
    } catch (e) {
      console.log(e);
    }
    let result = await config.flightSuretyData.isRegisteredAirLine.call(
      newAirline
    );

    // ASSERT
    assert.equal(
      result,
      true,
      "Airline should  be able to register another airline if it hasn provided funding"
    );
  });

  it("(airline) Registration of fifth and subsequent airlines requires multi-party consensus of 50% of registered airlines(error case)", async () => {
    // ARRANGE (Three airlines are already registered,
    // accounts[0] when contract was deployed, accounts[1] as firstAirLine, accounts[2] in previous test case)
    let fourthAirline = accounts[3];
    let fifthAirline = accounts[4];

    // ACT
    try {
      await config.flightSuretyData.registerAirline(fourthAirline); //Success
      await config.flightSuretyData.registerAirline(fifthAirline); //Failure, and fifthAirline gets one vote
    } catch (e) {
      console.log(e);
    }
    let result = await config.flightSuretyData.isRegisteredAirLine.call(
      fifthAirline
    );

    // ASSERT
    assert.equal(
      result,
      false,
      "Registration of fifth and subsequent airlines requires multi-party consensus of 50% of registered airlines"
    );
  });

  //This test case is dependent on previsou test case.
  it("(airline) Registration of fifth and subsequent airlines requires multi-party consensus of 50% of registered airlines(success case)", async () => {
    // ARRANGE
    // accounts[0] - accounts[3] are already registsred successfully in previous test case.
    let thirdAirline = accounts[2];
    let fourthAirline = accounts[3];
    let fifthAirline = accounts[4];
    //Lets fund airlines so that they can vote
    await config.flightSuretyData.fund({
      from: thirdAirline, //thirdAirline funds itself
      value: config.weiMultiple * 10, //send 10 ethers
    });
    await config.flightSuretyData.fund({
      from: fourthAirline, //fourthAirline funds itself
      value: config.weiMultiple * 10, //send 10 ethers
    });

    // ACT
    try {
      await config.flightSuretyData.registerAirline(fifthAirline, {
        from: thirdAirline,
      }); //vote count = 2. fifthAirline already got one vote in previous test case. (total registered airlines so far = 4)
    } catch (e) {
      console.log(e);
    }
    let result = await config.flightSuretyData.isRegisteredAirLine.call(
      fifthAirline
    );

    // ASSERT
    assert.equal(
      result,
      true,
      "Registration of fifth and subsequent airlines requires multi-party consensus of 50% of registered airlines"
    );
  });
});
