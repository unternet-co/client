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

function isDistributable(filePath) {
  return ['.dmg', '.zip', '.appimage', '.exe', '.yml'].includes(
    path.extname(filePath).toLowerCase()
  );
}

function uploadFiles(folder, done) {
  fs.readdir(folder, (err, files) => {
    if (err) return done(err);

    const uploadables = files.filter((f) => {
      const full = path.join(folder, f);
      return fs.statSync(full).isFile() && isDistributable(full);
    });

    if (uploadables.length === 0) {
      console.log('No distributable files found.');
      return done();
    }

    let count = 0;
    uploadables.forEach((file) => {
      const local = path.join(folder, file);
      const remote = `/${file}`;

      ftpClient.put(local, remote, (err) => {
        if (err) console.error(`❌ Failed: ${file}`, err);
        else console.log(`✅ Uploaded: ${file}`);

        count++;
        if (count === uploadables.length) done();
      });
    });
  });
}

ftpClient.on('ready', () => {
  console.log('🔌 FTP connected');
  uploadFiles(releaseDir, () => {
    console.log('🎉 All done');
    ftpClient.end();
  });
});

ftpClient.on('error', (err) => {
  console.error('FTP error:', err);
  process.exit(1);
});

console.log('Connecting to FTP...');
ftpClient.connect(config);
