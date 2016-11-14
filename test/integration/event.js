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
      let count = 0
      let subscription

      contract.Event(
        (error, subscriptionObject) => {
          if (error) {
            done(error)
          } else {
            subscription = subscriptionObject
          }
        },
        (error, event) => {
          if (error) {
            done(error)
          } else {
            console.log('Received event', JSON.stringify(event, null, 2))
            count++

            if (count === 2) {
              subscription.stop()
              done()
            }
          }
        })

      contract.emit()
      contract.emit()
    })
    .catch(done)
  )
})
