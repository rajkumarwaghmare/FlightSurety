import DOM from "./dom";
import Contract from "./contract";
import "./flightsurety.css";

(async () => {
  let result = null;

  let contract = new Contract("localhost", () => {
    // Read transaction
    contract.isOperational((error, result) => {
      console.log(error, result);
      display("Operational Status", "Check if contract is operational", [
        { label: "Operational Status", error: error, value: result },
      ]);
    });

    // User-submitted transaction
    DOM.elid("submit-oracle").addEventListener("click", () => {
      let flight = DOM.elid("flights-check").value;
      // Write transaction
      contract.fetchFlightStatus(flight, (error, result) => {
        display("Oracles", "Trigger oracles", [
          {
            label: "Fetch Flight Status",
            error: error,
            value: result.flight + " " + result.timestamp,
          },
        ]);
      });
    });

    DOM.elid("buy").addEventListener("click", () => {
      let flight = DOM.elid("flights").value;
      // Write transaction
      contract.buyInsurance(flight, (error, result) => {
        if (error) {
          console.log(error);
        } else {
          console.log(result);
        }
      });
    });

    DOM.elid("get-balance").addEventListener("click", () => {
      contract.getBalance((balance) => {
        console.log(contract.web3.utils.fromWei(balance));
        DOM.elid("my-balance").innerHTML =
          contract.web3.utils.fromWei(balance) + " ether";
      });
    });

    DOM.elid("get-credit").addEventListener("click", () => {
      contract.getCredits((error, result) => {
        console.log(error);
        console.log(contract.web3.utils.fromWei(result));
        DOM.elid("my-credit").innerHTML =
          contract.web3.utils.fromWei(result) + " ether";
      });
    });

    DOM.elid("withdraw").addEventListener("click", () => {
      contract.withdraw((error, result) => {
        console.log(error);
        console.log(result);
      });
    });

    DOM.elid("display-funds").addEventListener("click", () => {
      contract.getContractBalance((balance) => {
        console.log(contract.web3.utils.fromWei(balance));
        DOM.elid("contract-funds").innerHTML =
          contract.web3.utils.fromWei(balance) + " ether";
      });
    });

    DOM.elid("submit-funds").addEventListener("click", () => {
      contract.submitFunds();
    });
  });
})();

function display(title, description, results) {
  let displayDiv = DOM.elid("display-wrapper");
  let section = DOM.section();
  section.appendChild(DOM.h2(title));
  section.appendChild(DOM.h5(description));
  results.map((result) => {
    let row = section.appendChild(DOM.div({ className: "row" }));
    row.appendChild(DOM.div({ className: "col-sm-4 field" }, result.label));
    row.appendChild(
      DOM.div(
        { className: "col-sm-8 field-value" },
        result.error ? String(result.error) : String(result.value)
      )
    );
    section.appendChild(row);
  });
  displayDiv.append(section);
}
