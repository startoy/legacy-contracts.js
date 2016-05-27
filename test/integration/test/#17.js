'use strict'

var assert = require('assert')
var createDb = require('../createDb')
var erisContracts = require('../../../')
var Promise = require('bluebird')
var Solidity = require('solc')

describe('strings are encoded and decoded properly', function () {
  var contract

  before(function (done) {
    var dbPromises, source, compiled

    this.timeout(10 * 1000)

    dbPromises = createDb()

    source = `
      contract strings {
        function getString() constant returns (string) {
          return "hello";
        }

        function setAndGetString(string s) constant returns (string) {
          return s;
        }
      }
    `

    compiled = Solidity.compile(source).contracts.strings

    Promise.all(dbPromises).spread(function (url, validator) {
      var accountData
      var contractManager
      var abi
      var bytecode
      var contractFactory

      accountData = {
        address: validator.address,
        pubKey: validator.pub_key,
        privKey: validator.priv_key
      }

      contractManager = erisContracts.newContractManagerDev(url, accountData)
      abi = JSON.parse(compiled.interface)
      bytecode = compiled.bytecode
      contractFactory = contractManager.newContractFactory(abi)

      contractFactory.new({data: bytecode}, function (error, newContract) {
        assert.ifError(error)
        contract = newContract
        done()
      })
    })
  })

  it('gets a string constant', function (done) {
    contract.getString(function (error, string) {
      assert.ifError(error)
      assert.equal(string, 'hello')
      done()
    })
  })

  it('sets and gets a string', function (done) {
    contract.setAndGetString('hello', function (error, string) {
      assert.ifError(error)
      assert.equal(string, 'hello')
      done()
    })
  })
})
