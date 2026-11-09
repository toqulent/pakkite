const fs = require('fs')

exports.setup = function (osDataFolder) {
  const dataFolder = osDataFolder + '/pakkite'
  if (!fs.existsSync(dataFolder)) {
    fs.mkdirSync(dataFolder)
  }

  return dataFolder
}
