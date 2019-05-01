'use strict'

let s3connector = require('./s3connector').init()

module.exports.showerBusy = (event, context, callback) => {
  const floor = event.pathParameters.floor;
  s3connector.updateShowerStatusFileBusy(floor)
  .then(function () {
    showerLastUpdated(floor).catch(function (err) {
      console.log('Caught an error while updating last updated file: ' + err)
    })

    handleCallback(true, callback)
  }).catch(function (err) {
    handleCallback(false, callback, err)
  })
}

module.exports.showerFree = (event, context, callback) => {
  const floor = event.pathParameters.floor;
  s3connector.updateShowerStatusFileFree(floor)
    .then(function () {
      showerLastUpdated(floor).catch(function (err) {
        console.log('Caught an error while updating last updated file: ' + err)
      })

      handleCallback(true, callback)
    }).catch(function (err) {
      handleCallback(false, callback, err)
    })
}

function showerLastUpdated (floor) {
  return new Promise(function (resolve, reject) {
    let promises = []
    promises.push(s3connector.getStateFiles('state', floor))
    promises.push(s3connector.getStateFiles('last_updated', floor))
    Promise.all(promises).then(function (data) {
      let currentStateObject = JSON.parse(String.fromCharCode.apply(null, data[0].Body))
      let lastUpdatedObject = JSON.parse(String.fromCharCode.apply(null, data[1].Body))
      if (currentStateObject.state !== lastUpdatedObject.state) {
        s3connector.updateShowerLastUpdatedFile(currentStateObject, floor).then(function () {
          resolve(true)
        })
      } else {
        return resolve(true)
      }
    })
  })
}

function handleCallback (isSuccessful, callbackFunction, err) {
  let callbackObject = {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Success!'
    })
  }

  if (!isSuccessful) {
    callbackObject.statusCode = 500
    callbackObject.body = JSON.stringify({
      message: 'SOMETHING IS BROKEN',
      error: err
    })
  }

  callbackFunction(null, callbackObject)
}
