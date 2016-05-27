/* This file is for testing a contract create + call.
 */
var asrt = require('assert')
var createDb = require('../../createDb')
var edbModule = require('eris-db')
var eris = require('../../../..')

var abi = [
  {
    'constant': true,
    'inputs': [],
    'name': 'getMyAddress',
    'outputs': [
      {
        'name': 'callerAddress',
        'type': 'address'
      }
    ],
    'type': 'function'
  }
]

var code = '606060405260788060116000396000f30060606040526000357c0100000000000000000000000000000000000000000000000000000000900480639a166299146037576035565b005b6040600450606c565b604051808273ffffffffffffffffffffffffffffffffffffffff16815260200191505060405180910390f35b60003390506075565b9056'

var address = '1234123412341234123412341234123412341234'

var address2 = '0000000000000000000000000000000000001234'

var contract

describe('TestCreateAndCallWithAddress', function () {
  before(function (done) {
    this.timeout(10 * 1000)

    createDb('WebSocket').spread(function (url, validator) {
      var edb = edbModule.createInstance(url)

      edb.start(function (error) {
        if (error) {
          throw error
        }
        var pipe = new eris.pipes.DevPipe(edb, {
          address: address,
          privKey: validator.priv_key[1]
        })

        var contracts = eris.newContractManager(pipe)
        console.log('Creating. This should take a couple of seconds.')
        var contractFactory = contracts.newContractFactory(abi)
        contractFactory.new({data: code}, function (error, data) {
          if (error) {
            console.log('New contract error')
            console.log(error)
            throw error
          }
          contract = data
          done()
        })
      })
    })
  })

  describe('getMyAddress', function () {
    it("should return the address '" + address + "'", function (done) {
      contract.getMyAddress(function (error, data) {
        asrt.ifError(error)
        asrt.equal(data, address)
        done()
      })
    })

    it("should return the address '" + address2 + "'", function (done) {
      contract.getMyAddress({from: address2}, function (error, data) {
        asrt.ifError(error)
        asrt.equal(data, address2)
        done()
      })
    })
  })
})
