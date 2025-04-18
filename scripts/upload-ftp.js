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

function uploadDirectory(localDir, remoteDir, done) {
  fs.readdir(localDir, (err, items) => {
    if (err) return done(err);

    let pending = items.length;
    if (!pending) return done();

    items.forEach((item) => {
      const localPath = path.join(localDir, item);
      const remotePath = path.posix.join(remoteDir, item); // always forward slashes for FTP

      fs.stat(localPath, (err, stats) => {
        if (err) return done(err);

        if (stats.isDirectory()) {
          ftpClient.mkdir(remotePath, true, (err) => {
            if (err && err.code !== 550)
              console.warn(`mkdir failed for ${remotePath}:`, err);
            uploadDirectory(localPath, remotePath, checkDone);
          });
        } else {
          ftpClient.put(localPath, remotePath, (err) => {
            if (err) console.error(`Error uploading ${remotePath}:`, err);
            else console.log(`Uploaded ${remotePath}`);
            checkDone();
          });
        }
      });
    });

    function checkDone() {
      if (--pending === 0) done();
    }
  });
}

ftpClient.on('ready', () => {
  console.log('FTP connection established');
  uploadDirectory(releaseDir, '/', (err) => {
    if (err) {
      console.error('Upload failed:', err);
    } else {
      console.log('All files uploaded');
    }
    ftpClient.end();
  });
});

ftpClient.on('error', (err) => {
  console.error('FTP error:', err);
  process.exit(1);
});

console.log('Connecting to FTP server...');
ftpClient.connect(config);
