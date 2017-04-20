# This Template is Important!

Please fill out all sections of this template if you would like us to consider your issue, otherwise we may close it without comment.  By filling out the template you make the most efficient use of our time so that we can support you!  Win, win!

# Library Issue or Support Request?

This is the place to report any issues with the @monax/legacy-contracts.js JavaScript library.  If you need help with your Solidity code, please see Monax's [Premium Support & Education](https://monax.io/packages/) offering.

# Version Numbers

Fill in version numbers below.

* Node.js:
* Monax CLI:
* @monax/legacy-contracts:

# Issue Description

Describe your issue here.

# Code

Include all code and data needed to reproduce the problem by replacing the examples below.

## Solidity

```Solidity
contract IdisContractsFTW {
  uint storedData;

  function set(uint x) {
    storedData = x;
  }

  function get() constant returns (uint retVal) {
    return storedData;
  }
}
```

## JavaScript

```JavaScript
// requires
var fs = require ('fs');
var prompt = require('prompt');
var contracts = require('@monax/legacy-contracts');

// NOTE. On Windows/OSX do not use localhost. find the
// url of your chain with:
// docker-machine ls
// and find the docker machine name you are using (usually default or monax).
// for example, if the URL returned by docker-machine is tcp://192.168.99.100:2376
// then your burrowURL should be http://192.168.99.100:1337/rpc
var burrowURL = "http://localhost:1337/rpc";

// get the abi and deployed data squared away
var contractData = require('./epm.json');
var idisContractAddress = contractData["deployStorageK"];
var idisAbi = JSON.parse(fs.readFileSync("./abi/" + idisContractAddress));

// properly instantiate the contract objects manager using the burrowURL
// and the account data (which is a temporary hack)
var accountData = require('./accounts.json');
var contractsManager = contracts.newContractManagerDev(burrowURL, accountData.simplechain_full_000);

// properly instantiate the contract objects using the abi and address
var idisContract = contractsManager.newContractFactory(idisAbi).at(idisContractAddress);

// display the current value of idi's contract by calling
// the `get` function of idi's contract
function getValue(callback) {
  idisContract.get(function(error, result){
    if (error) { throw error }
    console.log("Idi's number is:\t\t\t" + result.toNumber());
    callback();
  });
}

// prompt the user to change the value of idi's contract
function changeValue() {
  prompt.message = "What number should Idi make it?";
  prompt.delimiter = "\t";
  prompt.start();
  prompt.get(['value'], function (error, result) {
    if (error) { throw error }
    setValue(result.value)
  });
}

// using legacy-contracts call the `set` function of idi's
// contract using the value which was recieved from the
// changeValue prompt
function setValue(value) {
  idisContract.set(value, function(error, result){
    if (error) { throw error }
    getValue(function(){});
  });
}

// run
getValue(changeValue);
```
