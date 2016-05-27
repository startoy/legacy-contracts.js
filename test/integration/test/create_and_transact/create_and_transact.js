/* This file is for testing a contract create + call.
 */
var asrt = require('assert')
var createDb = require('../../createDb')
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

var code = '60606040527f30783132333435363738394142434445460000000000000000000000000000006000600050555b5b60c080603a6000396000f30060606040526000357c0100000000000000000000000000000000000000000000000000000000900480631d1842331460415780637d3a8eff14606057603f565b005b604a600450608c565b6040518082815260200191505060405180910390f35b606f6004803590602001506095565b604051808381526020018281526020019250505060405180910390f35b60006000505481565b6000600060006000505491508150826000600050819055506000600050549050805060bb565b91509156'

var contracts
var contract

describe('TestCreateAndTransact', function () {
  before(function (done) {
    this.timeout(10 * 1000)

    createDb().spread(function (url, validator) {
      var edb = edbModule.createInstance(url)
      edb.start(function (error) {
        if (error) {
          throw error
        }
        var pipe = new eris.pipes.DevPipe(edb, validator.priv_key[1])
        contracts = eris.newContractManager(pipe)
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

  describe('setTestBytes32', function () {
    var input = 0xDEADBEEF
    var expected = ['3078313233343536373839414243444546000000000000000000000000000000',
      '00000000000000000000000000000000000000000000000000000000DEADBEEF']
    this.timeout(5000)
    it('should set the bytes in the contract to 0xdeadbeef', function (done) {
      contract.setTestBytes32(input, function (error, output) {
        console.log('output')
        console.log(output)
        asrt.ifError(error)
        asrt.deepEqual(output, expected)
        done()
      })
    })
  })
})
