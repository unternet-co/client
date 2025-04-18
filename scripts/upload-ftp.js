const Ftp = require('ftp');
const path = require('path');
const fs = require('fs');

const ftpClient = new Ftp();

const config = {
  host: process.env.FTP_HOST,
  user: process.env.FTP_USERNAME,
  password: process.env.FTP_PASSWORD,
  secure: true,
};

const releaseDir = path.join(__dirname, '..', 'release');

function isDistributableFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return ['.dmg', '.zip', '.appimage', '.exe', '.yml'].includes(ext);
}

function uploadFlatFiles(folder, done) {
  fs.readdir(folder, (err, files) => {
    if (err) return done(err);

    const uploadables = files.filter((f) => {
      const fullPath = path.join(folder, f);
      return fs.statSync(fullPath).isFile() && isDistributableFile(fullPath);
    });

    if (uploadables.length === 0) {
      console.log('No distributable files found to upload.');
      return done();
    }

    let count = 0;
    uploadables.forEach((file) => {
      const localPath = path.join(folder, file);
      const remotePath = `/${file}`;

      ftpClient.put(localPath, remotePath, (err) => {
        if (err) {
          console.error(`❌ Error uploading ${file}:`, err);
        } else {
          console.log(`✅ Uploaded ${file}`);
        }

        count++;
        if (count === uploadables.length) done();
      });
    });
  });
}

ftpClient.on('ready', () => {
  console.log('FTP connection established');
  uploadFlatFiles(releaseDir, () => {
    console.log('🎉 Finished uploading distributables.');
    ftpClient.end();
  });
});

ftpClient.on('error', (err) => {
  console.error('FTP error:', err);
  process.exit(1);
});

console.log('Connecting to FTP server...');
ftpClient.connect(config);
