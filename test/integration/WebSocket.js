'use strict'

const assert = require('assert')
const childProcess = require('mz/child_process')
const erisContracts = require('../..')
const fs = require('mz/fs')
const I = require('iteray')
const Promise = require('bluebird')
const R = require('ramda')
const Solidity = require('solc')
const untildify = require('untildify')
const url = require('url')
const WebSocket = require('ws')

const exec = R.composeP(R.trim, R.head, childProcess.exec)

const intervalAsyncIterable = (delay) => {
  let lastOutput = Date.now()

  return I.toAsyncIterable((callback) =>
    () =>
      setTimeout(() => {
        lastOutput = Date.now()

        callback(null, {
          done: false,
          value: lastOutput
        })
      }, delay - (Date.now() - lastOutput))
  )
}

const poll = R.curry((action, interval) => {
  const asyncIterator = I.toIterator(R.pipe(
    I.map(() => Promise.try(action)),
    I.pullSerially
  )(interval))

  const next = () =>
    asyncIterator.next().catch(next)

  return next().then(R.prop('value'))
})

const privateValidator = () =>
  fs.readFile(untildify('~/.eris/chains/default/priv_validator.json'))
    .then(JSON.parse)

const dockerMachineIp = () =>
  exec('docker-machine ip').catch(() => 'localhost')

const blockchainUrl = (name) => {
  const portPromise = exec(`
    id=$(eris chains inspect ${name} Id)
    docker inspect --format='{{(index (index .NetworkSettings.Ports "1337` +
      `/tcp") 0).HostPort}}' $id
  `)

  return Promise.all([dockerMachineIp(), portPromise])
    .spread((hostname, port) => url.format({
      protocol: 'ws:',
      slashes: true,
      hostname,
      port,
      pathname: '/socketrpc'
    })
  )
}

const webSocketIsAvailable = (url) =>
  poll(() =>
    new Promise((resolve, reject) => {
      const socket = new WebSocket(url)

      socket.once('open', () => {
        socket.close()
        resolve()
      })

      socket.once('error', reject)
    }),
    intervalAsyncIterable(100)
  ).then(() => url)

const newBlockchain = (name) => {
  const urlPromise = exec(`
    eris chains rm --data --dir --file --force ${name}
    eris chains new --publish ${name}
  `, {env: R.assoc('ERIS_PULL_APPROVE', true, process.env)})
    .then(() => blockchainUrl(name))
    .then(webSocketIsAvailable)

  return Promise.all([urlPromise, privateValidator()])
    .spread((url, validator) =>
      Promise.fromCallback((callback) =>
        erisContracts.newContractManagerDev(url, {
          address: validator.address,
          pubKey: validator.pub_key,
          privKey: validator.priv_key
        }, callback)
      )
  )
}

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

  return newBlockchain('blockchain').then((contractManager) => {
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
