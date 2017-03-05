'use strict'

const erisContracts = require('../..')
const I = require('iteray')
const Promise = require('bluebird')
const Solidity = require('solc')
const erisDbTest = require('eris-db/lib/test')
const test = require('../../lib/test')

const vector = test.Vector()

before(vector.before(__dirname, {protocol: 'http:'}))
after(vector.after())

it('#38', vector.it(function (manager) {
  this.timeout(10 * 1000)

  const source = `
    contract Contract {
        event Event();

        function emit() {
            Event();
        }
    }
  `

  return test.compile(manager, source, 'Contract').then((contract) => {
    const compiled = Solidity.compile(source, 1).contracts.Contract
    const abi = JSON.parse(compiled.interface)
    const contractFactory = manager.newContractFactory(abi)

    return Promise.fromCallback((callback) =>
      contractFactory.at(contract.address, callback)
    ).then((secondContract) =>
      new Promise((resolve, reject) => {
        secondContract.Event.once((error, event) => {
          if (error) {
            reject(error)
          } else {
            resolve(event)
          }
        })

        contract.emit()
      })
    )
  })
}))
