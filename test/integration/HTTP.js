'use strict'

const assert = require('assert')
const childProcess = require('mz/child_process')
const ErisDb = require('eris-db')
const erisContracts = require('../..')
const F = require('fairmont')
const fs = require('mz/fs')
const I = require('iteray')
const Promise = require('bluebird')
const R = require('ramda')
const Solidity = require('solc')
const untildify = require('untildify')
const url = require('url')

const exec = R.composeP(R.trim, F.first, childProcess.exec)

const privateValidator = () =>
  fs.readFile(untildify('~/.eris/chains/default/priv_validator.json'))
    .then(JSON.parse)

const dockerMachineIp = () =>
  exec('docker-machine ip').catch(() => 'localhost')

const blockchainUrl = (name) => {
  const blockchainPort = () =>
    exec(`
      id=$(eris chains inspect ${name} Id)
      docker inspect --format='{{(index (index .NetworkSettings.Ports "1337` +
        `/tcp") 0).HostPort}}' $id
    `)

  return Promise.all([dockerMachineIp(), blockchainPort()])
    .spread((hostname, port) => ({
      protocol: 'http:',
      slashes: true,
      hostname,
      port,
      pathname: '/rpc'
    })
  )
}

const blockchainIsAvailable = (erisDb) =>
  I.poll(
    () => Promise.fromCallback(
      (callback) => erisDb.blockchain().getChainId(callback)
    ),
    I.intervalAsyncIterator(100)
  ).then(R.always(erisDb))

const newBlockchain = (name) =>
  exec(`
    eris chains rm --data --dir --file --force ${name}
    eris chains new --publish ${name}
  `, {env: R.assoc('ERIS_PULL_APPROVE', true, process.env)}).then(() =>
    blockchainUrl(name).then((blockchainUrl) =>
      blockchainIsAvailable(ErisDb.createInstance(url.format(blockchainUrl)))
    )
  )

const source = `
  contract SimpleStorage {
      uint storedData;

      function set(uint x) {
          storedData = x;
      }

      function get() constant returns (uint retVal) {
          return storedData;
      }
  }
`

const compile = source =>
  Solidity.compile(source, 1).contracts

it('sets and gets a value from a contract', function () {
  this.timeout(60 * 1000)

  return Promise.all([newBlockchain('blockchain'), privateValidator()])
    .spread((erisDb, validator) => {
      const contractManager = erisContracts.newContractManagerDev(
        erisDb._client._URL, {
          address: validator.address,
          pubKey: validator.pub_key,
          privKey: validator.priv_key
        }
      )

      const compiled = compile(source).SimpleStorage
      const abi = JSON.parse(compiled.interface)
      const bytecode = compiled.bytecode
      const contractFactory = contractManager.newContractFactory(abi)

      return Promise.fromCallback((callback) =>
        contractFactory.new({data: bytecode}, callback)
      ).then((contract) =>
        Promise.fromCallback((callback) =>
          contract.set(42, callback)
        ).then(() =>
          Promise.fromCallback((callback) =>
            contract.get(callback)
          )
        )
      ).then((value) => {
        assert.equal(value, 42)
      })
    })
})
