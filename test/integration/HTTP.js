'use strict'

const assert = require('assert')
const erisContracts = require('../..')
const Promise = require('bluebird')
const Solidity = require('solc')
const test = require('eris-db/lib/test')

const source = `
  contract SimpleStorage {
      uint storedData;

      function set(uint x) {
          storedData = x;
      }

      function get() constant returns (uint retVal) {
          return storedData;
      }
  }
`

const compile = source =>
  Solidity.compile(source, 1).contracts

it('sets and gets a value from a contract', function () {
  this.timeout(60 * 1000)

  return Promise.all([
    test.newBlockchain('blockchain', {protocol: 'http:'}),
    test.privateValidator()
  ]).spread((url, validator) => {
    const contractManager = erisContracts.newContractManagerDev(url, {
      address: validator.address,
      pubKey: validator.pub_key,
      privKey: validator.priv_key
    })

    const compiled = compile(source).SimpleStorage
    const abi = JSON.parse(compiled.interface)
    const bytecode = compiled.bytecode
    const contractFactory = contractManager.newContractFactory(abi)

    return Promise.fromCallback((callback) =>
      contractFactory.new({data: bytecode}, callback)
    ).then((contract) =>
      Promise.fromCallback((callback) =>
        contract.set(42, callback)
      ).then(() =>
        Promise.fromCallback((callback) =>
          contract.get(callback)
        )
      )
    ).then((value) => {
      assert.equal(value, 42)
    })
  })
})
