pragma solidity ^0.4.25;

import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";

contract FlightSuretyData {
    using SafeMath for uint256;

    uint8 private constant MAX_INITIAL_REGISTRABLE_AIRLINES = 4;
    uint256 private constant MIN_FUNDING = 1e19;//10 ethers
    uint256 private constant INSURANCE_REFUND_IN_ETHER = 1.5 * 1e18;//1.5 ethers in wei

    /********************************************************************************************/
    /*                                       DATA VARIABLES                                     */
    /********************************************************************************************/

    address private contractOwner;                                      // Account used to deploy contract
    bool private operational = true;                                    // Blocks all state changes throughout the contract if false

    struct Flight {
        bool isRegistered;
        uint8 statusCode;
        uint256 updatedTimestamp;        
        address airline;
    }
    mapping(bytes32 => Flight) private flights;
    mapping(address => bool) private airlines; //Register AirLine with initial funding status as false
    uint256 private registeredAirlinesCount = 0;//as we cant get length/size of mapping
    mapping(address => bool) private authorizedCallers;// Who can call this contract
    mapping(address => uint8) private airlineRegistrationVotes;
    mapping(address => uint256) private airlineFunding;
    mapping(string => address[]) private insuranceCustomers;//Map flight to array of customers who bought insurance for this flight
    mapping(address => uint256) private customerCredits;//customer address to credits

    /********************************************************************************************/
    /*                                       EVENT DEFINITIONS                                  */
    /********************************************************************************************/


    /**
    * @dev Constructor
    *      The deploying account becomes contractOwner
    */
    constructor
                                (
                                ) 
                                public 
    {
        contractOwner = msg.sender;
        authorizedCallers[msg.sender] = true;//So that FlightSuretyApp can call methods of this contract
        /**
            TODO check how we can pass first airline address to this contract while creating an object in FlightSuretyApp
         */
        airlines[msg.sender] = true;//Register first airline. 
        registeredAirlinesCount++;
        airlineFunding[msg.sender] = MIN_FUNDING;
    }

    /********************************************************************************************/
    /*                                       FUNCTION MODIFIERS                                 */
    /********************************************************************************************/

    // Modifiers help avoid duplication of code. They are typically used to validate something
    // before a function is allowed to be executed.

    /**
    * @dev Modifier that requires the "operational" boolean variable to be "true"
    *      This is used on all state changing functions to pause the contract in 
    *      the event there is an issue that needs to be fixed
    */
    modifier requireIsOperational() 
    {
        require(operational, "Contract is currently not operational");
        _;  // All modifiers require an "_" which indicates where the function body will be added
    }

    /**
    * @dev Modifier that requires the "ContractOwner" account to be the function caller
    */
    modifier requireContractOwner()
    {
        require(msg.sender == contractOwner, "Caller is not contract owner");
        _;
    }

    modifier requireAuthorizedCaller()
    {
        require(authorizedCallers[msg.sender], "Caller is not authorized");
        _;
    }

    /**
        Add to the list of authorized callers who can call this contract.
        ONLY contract owner can make this call.
     */
    function authorizeCaller
                            (
                                address caller
                            )
                            external
                            requireIsOperational
    {
        authorizedCallers[caller] = true;
    }

    //Revert the permissions
    function deAuthorizeCaller
                            (
                                address caller
                            )
                            external
                            requireIsOperational
                            requireContractOwner 
    {
        authorizedCallers[caller] = false;
    }

    /********************************************************************************************/
    /*                                       UTILITY FUNCTIONS                                  */
    /********************************************************************************************/

    /**
    * @dev Get operating status of contract
    *
    * @return A bool that is the current operating status
    */      
    function isOperational() 
                            public 
                            view 
                            returns(bool) 
    {
        return operational;
    }


    /**
    * @dev Sets contract operations on/off
    *
    * When operational mode is disabled, all write transactions except for this one will fail
    */    
    function setOperatingStatus
                            (
                                bool mode
                            ) 
                            external
                            requireContractOwner 
    {
        operational = mode;
    }

    /********************************************************************************************/
    /*                                     SMART CONTRACT FUNCTIONS                             */
    /********************************************************************************************/

   /**
    * @dev Add an airline to the registration queue
    *      Can only be called from FlightSuretyApp contract
    *
    */   
    function registerAirline
                            (
                                address newAirline   
                            )
                            external
                            requireIsOperational
                            requireAirLineRegistrable
                            returns(bool success, uint256 votes)
    {
        require(!airlines[newAirline], "This AirLine is already registered!");
        airlineRegistrationVotes[newAirline] += 1;
        //Registration of fifth and subsequent airlines requires multi-party consensus of 50% of registered airlines
        if(registeredAirlinesCount < MAX_INITIAL_REGISTRABLE_AIRLINES 
            || airlineRegistrationVotes[newAirline] >= registeredAirlinesCount/2) {
            airlines[newAirline] = true;
            registeredAirlinesCount++;
            return (true, airlineRegistrationVotes[newAirline]);
        } else {
           return (false, airlineRegistrationVotes[newAirline]);
        }
    }

    /**
        Get the count of registered airlines so far.
        Can only be called from FlightSuretyApp
     */
    function registeredAirLinesCount()
                                    view
                                    external
                                    requireIsOperational
                                    requireAuthorizedCaller
                                    returns(uint256)
    {
        return registeredAirlinesCount;
    }

    //Check if this AirLine is registered.
    function isRegisteredAirLine
                                (
                                    address airlineAddress
                                )
                                view
                                public
                                requireIsOperational
                                requireAuthorizedCaller
                                returns(bool)
    {
        return airlines[airlineAddress];
    }

    modifier requireAirLineRegistrable()
    {
        //check fund of calling airline
        bool canBeRegistered = airlineFunding[msg.sender] == MIN_FUNDING;
        require(airlineFunding[msg.sender] != 0, "This AirLine Can not be registered");
        _;
    }

   /**
    * @dev Register a future flight for insuring.
    *
    */  
    function registerFlight
                                (
                                    bytes32 flightKey,
                                    bool isRegistered,
                                    uint8 statusCode,
                                    uint256 updatedTimestamp       
                                )
                                external
                                requireIsOperational
                                requireAuthorizedCaller
    {
        require(isRegisteredAirLine(msg.sender), "This AirLine is not registsred!");
        require(flights[flightKey].isRegistered, "This Flight is already registered!");

        flights[flightKey] = Flight(isRegistered, statusCode, updatedTimestamp, msg.sender);
    }

   /**
    * @dev Buy insurance for a flight
    * Ability to purchase flight insurance for no more than 1 ether
    */   
    function buy
                            (  
                                string flight,
                                address customer                      
                            )
                            external
                            requireIsOperational
    {
        insuranceCustomers[flight].push(customer);
    }

    /**
     *  @dev Credits payouts to insurees
    */
    function creditInsurees
                                (
                                    address customer,
                                    uint256 amount
                                )
                                internal
                                requireAuthorizedCaller
                                requireIsOperational
    {
        if(customerCredits[customer] == 0) {//TODO support credits per flight
            customerCredits[customer] += amount; 
        }
        //else we have already credited, extra request might come when more than 3 oracles send the correct answer
        
    }
    
    
    function refundToCustomers
                                (
                                    string  flight
                                )
                                external
                                requireAuthorizedCaller
                                requireIsOperational
    {
        address[] memory eligibleCustomers = insuranceCustomers[flight];
        require(eligibleCustomers.length > 0, "No eligible customer exists!");
        require(address(this).balance >= 1.5 ether, "Not sufficint funds available with the contract");

        //TODO find better altervative to using  for loop!
        for(uint256 i=0; i < eligibleCustomers.length; i++) {
            creditInsurees(eligibleCustomers[i], 1.5 ether);//We have assumed user will buy the insurance for 1ether so we refund them 1.5 ethers
        }
    }

    /**
     *  @dev Transfers eligible payout funds to insuree
        For security reasons let customer withdraw the amount.
     *
    */
    function withdraw
                            (
                                address customer
                            )
                            payable
                            external
                            requireIsOperational
    {
        uint256 credits = customerCredits[customer];
        require(credits > 0 , "You dont have any credits to withdraw");
        require(credits < address(this).balance , "Contract balance is less than you credits");

        customerCredits[customer] = 0; 
        customer.transfer(credits);
    }

    function getCredits
                            (
                                address customer
                            )
                            public
                            view
                            requireIsOperational
                            returns(uint256)
    {
        return customerCredits[customer];
    }

   /**
    * @dev Initial funding for the insurance. Unless there are too many delayed flights
    *      resulting in insurance payouts, the contract should be self-sustaining
    *
    */   
    function fund
                            ( 
                                
                            )
                            public
                            payable
                            requireIsOperational
    {
        require(airlines[msg.sender], "AirLine should be registered before getting funded");
        require(msg.value >= MIN_FUNDING, "Sent fund are not sufficient!");

        airlineFunding[msg.sender] = msg.value;
    }

    function getFlightKey
                        (
                            address airline,
                            string memory flight,
                            uint256 timestamp
                        )
                        pure
                        internal
                        returns(bytes32) 
    {
        return keccak256(abi.encodePacked(airline, flight, timestamp));
    }

    /**
    * @dev Fallback function for funding smart contract.
    *
    */
    function() 
                            external 
                            payable 
    {
        fund();
    }


}

