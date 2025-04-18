const Ftp = require('ftp');
const path = require('path');
const fs = require('fs');

const ftpClient = new Ftp();

// Configuration
const config = {
  host: process.env.FTP_HOST || 'ftp.koumbit.net',
  user: process.env.FTP_USERNAME,
  password: process.env.FTP_PASSWORD,
  secure: true,
};

// Directory to upload
const releaseDir = path.join(__dirname, '..', 'release');

ftpClient.on('ready', function () {
  console.log('FTP connection established');

  // Upload all files in the release directory
  fs.readdir(releaseDir, (err, files) => {
    if (err) {
      console.error('Error reading release directory:', err);
      ftpClient.end();
      return;
    }

    let uploadCount = 0;
    const totalFiles = files.length;

    files.forEach((file) => {
      const localPath = path.join(releaseDir, file);
      const remotePath = `/${file}`;

      ftpClient.put(localPath, remotePath, (err) => {
        if (err) {
          console.error(`Error uploading ${file}:`, err);
        } else {
          console.log(`Uploaded ${file}`);
        }

        uploadCount++;
        if (uploadCount === totalFiles) {
          console.log('All files uploaded');
          ftpClient.end();
        }
      });
    });
  });
});

ftpClient.on('error', function (err) {
  console.error('FTP error:', err);
  process.exit(1);
});

console.log('Connecting to FTP server...');
ftpClient.connect(config);
