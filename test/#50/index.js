'use strict'

const assert = require('assert')
const Promise = require('bluebird')
const test = require('../../lib/test')

const vector = test.Vector()

before(vector.before(__dirname, {protocol: 'http:'}))
after(vector.after())

it('#50', vector.it(function (manager) {
  this.timeout(10 * 1000)

  const source = `
    contract SimpleStorage {
        uint storedData;

        function set(uint x) {
            storedData = x;
        }

        function get() returns (uint retVal) {
            return storedData;
        }
    }
  `

  return test.compile(manager, source, 'SimpleStorage').then((contract) =>
    Promise.fromCallback((callback) =>
      contract.set(42, callback)
    ).then(() =>
      Promise.fromCallback((callback) =>
        contract.get.call(callback)
      )
    )
  ).then((value) => {
    assert.equal(value, 42)
  })
}))
