const fs = require('node:fs')
const path = require('node:path')

// Windows packaging copies the Electron bun already installed. The Linux
// container has no host dist, so returning null lets electron-builder download.
function electronDist(options) {
  const dist = path.join(options.packager.projectDir, 'node_modules', 'electron', 'dist')
  const executable = process.platform === 'win32' ? 'electron.exe' : 'electron'
  return fs.existsSync(path.join(dist, executable)) ? dist : null
}

module.exports = electronDist
module.exports.electronDist = electronDist
