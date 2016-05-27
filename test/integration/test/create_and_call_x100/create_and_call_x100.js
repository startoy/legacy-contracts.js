var asrt = require('assert')
var createDb = require('../../createDb')
var edbModule = require('eris-db')
var eris = require('../../../..')

var abi = [
  {
    'constant': true,
    'inputs': [],
    'name': 'testBytes32',
    'outputs': [
      {
        'name': '',
        'type': 'bytes32'
      }
    ],
    'type': 'function'
  },
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

var code = '6060604052670123456789abcdef6001026000600050555b5b60c08060256000396000f30060606040526000357c0100000000000000000000000000000000000000000000000000000000900480631d1842331460415780637d3a8eff14606057603f565b005b604a600450608c565b6040518082815260200191505060405180910390f35b606f6004803590602001506095565b604051808381526020018281526020019250505060405180910390f35b60006000505481565b6000600060006000505491508150826000600050819055506000600050549050805060bb565b91509156'

var contract

describe('TestCreateAndCall100Times', function () {
  before(function (done) {
    this.timeout(10 * 1000)

    createDb('WebSocket').spread(function (url, validator) {
      var edb = edbModule.createInstance(url)
      edb.start(function (error) {
        if (error) {
          throw error
        }
        var pipe = new eris.pipes.DevPipe(edb, validator.priv_key[1])
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

  describe('testBytes32', function () {
    var input = 0xDEADBEEF

    this.timeout(60000) // 1 minute

    it('do 100 calls at once', function (done) {
      for (var i = 0; i < 100; i++) {
        contract.testBytes32(input, function (error, output) {
          asrt.ifError(error)
          reg(done)
        })
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
