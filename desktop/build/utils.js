const fs = require('fs');
const path = require('path');

function copyRecursively(sourceDir, destDir) {
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  fs.readdirSync(sourceDir).forEach((file) => {
    const sourcePath = path.join(sourceDir, file);
    const destPath = path.join(destDir, file);

    if (fs.statSync(sourcePath).isDirectory()) {
      copyRecursively(sourcePath, destPath);
    } else {
      fs.copyFileSync(sourcePath, destPath);
    }
  });
}

module.exports = { copyRecursively };
