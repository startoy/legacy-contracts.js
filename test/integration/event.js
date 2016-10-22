'use strict'

const test = require('../../lib/test')

const source = `
  contract Contract {
      event Event();

      function emit() {
          Event();
      }
  }
`

it('listens to an event from a contract', function (done) {
  this.timeout(60 * 1000)

  test.newContractManager('blockchain', {protocol: 'http:'}).then((manager) =>
    test.compile(manager, source, 'Contract').then((contract) => {
      contract.Event.once((error, event) => {
        if (error) {
          throw error
        } else {
          console.log('Received event', JSON.stringify(event, null, 2))
          done()
        }
      })

      contract.emit()
    })
    .catch(done)
  )
})
