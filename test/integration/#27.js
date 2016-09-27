'use strict'

const assert = require('assert')
const Promise = require('bluebird')
const test = require('../../lib/test')

const source = `
  contract twentyseven {
    function getString2() constant returns (string){
        string memory abcde = new string(3);
        return "a";
    }
  }
`

it('sets and gets a value from a contract', function () {
  this.timeout(60 * 1000)

  return test.newContractManager('blockchain').then((contractManager) => {
    const compiled = test.compile(source).twentyseven
    const abi = JSON.parse(compiled.interface)
    const bytecode = compiled.bytecode
    const contractFactory = contractManager.newContractFactory(abi)

    return Promise.fromCallback((callback) =>
      contractFactory.new({data: bytecode}, callback)
    ).then((contract) =>
      Promise.fromCallback((callback) => contract.getString2(callback))
        .then((result) => {
          assert.equal(result, 'a')
        })
    )
  })
})
