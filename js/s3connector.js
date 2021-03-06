'use strict'

let S3 = require('aws-sdk/clients/s3')
let SHOWER_BUCKET = 'shower.willygood.site'
let SHOWER_STATUS_FILE_NAME = 'state'
let SHOWER_LAST_UPDATED_FILE_NAME = 'last_updated'

module.exports.init = function () {
  S3 = new S3({
    apiVersion: '2012-08-10',
    signatureVersion: 'v4',
    region: 'us-east-1'
  })

  return this
}

module.exports.updateShowerStatusFileBusy = function (floor) {
  return new Promise((resolve, reject) => {
    S3.putObject(updateShowerStatusParams('NO',floor), handlePromiseError(resolve, reject))
  })
}

module.exports.updateShowerStatusFileFree = function (floor) {
  return new Promise((resolve, reject) => {
    S3.putObject(updateShowerStatusParams('YES',floor), handlePromiseError(resolve, reject))
  })
}

module.exports.updateShowerLastUpdatedFile = function (stateFile, floor) {
  return new Promise((resolve, reject) => {
    S3.putObject(getUpdateParams(stateFile, floor), handlePromiseError(resolve, reject))
  })
}

module.exports.getStateFiles = function (fileName, floor) {
  return new Promise((resolve, reject) => {
    S3.getObject(generateGetObjectParams(fileName + floor), handlePromiseError(resolve, reject))
  })
}

function updateShowerStatusParams (isFree, floor) {
  return {
    Bucket: SHOWER_BUCKET,
    Key: SHOWER_STATUS_FILE_NAME + floor,
    ACL: 'public-read',
    Body: JSON.stringify({state: isFree, UpdatedDate: new Date().toISOString()})
  }
}

function getUpdateParams (stateFile, floor) {
  return {
    Bucket: SHOWER_BUCKET,
    Key: SHOWER_LAST_UPDATED_FILE_NAME + floor,
    ACL: 'public-read',
    Body: JSON.stringify(stateFile)
  }
}

function generateGetObjectParams (fileName) {
  return {
    Bucket: SHOWER_BUCKET,
    Key: fileName
  }
}

function handlePromiseError (resolve, reject) {
  return (err, data) => {
    if (err) {
      reject(err)
    } else {
      resolve(data)
    }
  }
}
