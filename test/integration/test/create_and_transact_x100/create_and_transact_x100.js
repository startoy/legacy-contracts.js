var createDb = require('../../createDb')
var asrt = require('assert')
var edbModule = require('eris-db')
var eris = require('../../../..')

var abi = [
  {
    'constant': false,
    'inputs': [
      {
        'name': 'bytes32In',
        'type': 'bytes32'
      }
    ],
    'name': 'setTestBytes32',
    'outputs': [
      {
        'name': 'bytes32Prev',
        'type': 'bytes32'
      },
      {
        'name': 'bytes32New',
        'type': 'bytes32'
      }
    ],
    'type': 'function'
  },
  {
    'inputs': [],
    'type': 'constructor'
  }
]

var code = '6060604052670123456789abcdef6001026000600050555b5b608e8060256000396000f30060606040526000357c0100000000000000000000000000000000000000000000000000000000900480637d3a8eff146037576035565b005b60466004803590602001506063565b604051808381526020018281526020019250505060405180910390f35b600060006000600050549150815082600060005081905550600060005054905080506089565b91509156'

var edb

var contractFactory

var contract

describe('TestCreateAndTransact100Times', function () {
  var privKey

  before(function (done) {
    this.timeout(10 * 1000)

    createDb('WebSocket').spread(function (url, validator) {
      edb = edbModule.createInstance(url)
      privKey = validator.priv_key[1]

      edb.start(function (error) {
        if (error) {
          throw error
        }
        var pipe = new eris.pipes.DevPipe(edb, privKey)
        var contracts = eris.contracts(pipe)
        console.log('Creating. This should take a couple of seconds.')
        contractFactory = contracts(abi)
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

  describe('setTestBytes32', function () {
    var input = 0xDEADBEEF

    this.timeout(60000) // 1 minute

    it('should set the bytes in the contract to 0xdeadbeef then do 100 transactions at once', function (done) {
      for (var i = 0; i < 100; i++) {
        setTimeout(function () {
          if (Math.random() < 0.33) {
            contract.setTestBytes32(input, function (error, output) {
              asrt.ifError(error)
              reg(done)
            })
          } else if (Math.random() < 0.66) {
            contractFactory.new({data: code}, function (error, data) {
              if (error) {
                console.log('New contract error')
                console.log(error)
                throw error
              }
              reg(done)
            })
          } else {
            edb.namereg().setEntry(privKey, Math.random().toString(), 'data', 500, function () {
              reg(done)
            })
          }
        }, Math.floor(Math.random() * 15000))
      }
    })
  })

  var counter = 0

  function reg (done) {
    if (++counter === 100) {
      done()
    }
  }
})
