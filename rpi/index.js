// var http = require('http');
var http = require('follow-redirects').http

const exec = require('child_process').exec
const floor = 'three'

let SHOWER_READ_PORT = 23

console.log('Starting...')

sendStatus()
initPort(SHOWER_READ_PORT, function () {
  setInterval(sendStatus, 5000)
})

function readPort (port, callback) {
  exec('gpio read ' + port, (err, stdout, stderr) => {
    if (err) {
      console.log(err)
      return err
    }
    return callback(stdout)
  })
}

function initPort (port, callback) {
  exec('gpio mode ' + port + ' in', (err, stdout, stderr) => {
    if (err) {
      console.log(err)
      return err
    }

    exec('gpio mode ' + port + ' down', (err, stdout, stderr) => {
      if (err) {
        console.log(err)
        return err
      }

      return callback(stdout)
    })
  })
}

function sendStatus () {
  readPort(SHOWER_READ_PORT, function (status) {
    var path = '/dev/shower/busy/three'
    if (status.trim() === '1') {
      path = '/dev/shower/free/three'
    }
    http.get({
      hostname: '5crnt4ra63.execute-api.us-east-1.amazonaws.com',
      port: 80,
      path: path
    }, (res) => {
    }).on('error', (e) => {
      // console.log('Got error: $(e.message')
    })
  })
};
