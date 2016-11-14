'use strict'

const assert = require('assert')
const Promise = require('bluebird')
const test = require('../../lib/test')

const source = `
  contract Test {

      function getAddress() returns (address) {
        return this;
      }

      function getNumber() returns (uint) {
        return 100;
      }

      function getCombination() returns (uint _number, address _address) {
        _number = 100;
        _address = this;
      }

  }
`

it('sets and gets a value from a contract', function () {
  this.timeout(60 * 1000)

  return test.newContractManager('blockchain', {protocol: 'http:'})
    .then((manager) =>
      test.compile(manager, source, 'Test')
    ).then((contract) =>
      Promise.fromCallback((callback) =>
        contract.getCombination(callback)
      )
    ).then(([number, address]) => {
      assert.equal(number, 100)
      assert.equal(address.length, 40)
    })
})
