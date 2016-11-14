'use strict'

const assert = require('assert')
const Promise = require('bluebird')
const test = require('../../lib/test')

const source = `
  contract Test{

  	string _name;

  	function setName(string newname) {
  		_name = newname;
  	}

  	function getNameConstant() constant returns (string) {
  		return _name;
  	}

  	function getName() returns (string) {
  		return _name;
  	}
  }
`

it('sets and gets a value from a contract', function () {
  this.timeout(60 * 1000)

  return test.newContractManager('blockchain', {protocol: 'http:'})
    .then((manager) =>
      test.compile(manager, source, 'Test').then((contract) =>
        Promise.fromCallback((callback) =>
          contract.setName('Batman', callback)
        ).then(() =>
          Promise.all([
            Promise.fromCallback((callback) =>
              contract.getNameConstant(callback)
            ),
            Promise.fromCallback((callback) =>
              contract.getName(callback)
            )
          ])
        )
      ).then(([constant, nonConstant]) => {
        assert.equal(constant, nonConstant)
      })
    )
})
