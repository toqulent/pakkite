const fs = require('fs')

let fd = null
let stateCallback = null

function notify (active, err) {
  if (stateCallback) stateCallback(active, err)
}

function closeFd () {
  const closing = fd
  fd = null
  if (closing !== null) {
    fs.closeSync(closing)
  }
}

exports.isActive = function () {
  return fd !== null
}

exports.onStateChange = function (callback) {
  stateCallback = callback
}

exports.start = function (filePath) {
  fd = fs.openSync(filePath, 'a+')
  const size = fs.fstatSync(fd).size
  if (size > 0) {
    const tail = Buffer.alloc(1)
    fs.readSync(fd, tail, 0, 1, size - 1)
    if (tail[0] !== 0x0A) {
      fs.writeSync(fd, '\n')
    }
  }
  notify(true)
}

exports.stop = function () {
  if (fd === null) return
  closeFd()
  notify(false)
}

exports.write = function (packet) {
  if (fd === null) return
  try {
    fs.writeSync(fd, JSON.stringify(packet) + '\n')
  } catch (err) {
    closeFd()
    notify(false, err)
  }
}
