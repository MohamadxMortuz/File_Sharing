const crypto = require('crypto');
const fs = require('fs');

const algorithm = 'aes-256-cbc';

const getKey = () => {
  const keyStr = process.env.ENCRYPTION_KEY || '';
  return crypto.createHash('sha256').update(keyStr).digest();
};

const encryptBuffer = (buffer) => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
  return { encrypted, iv };
};

const decryptBuffer = (encryptedBuffer, iv) => {
  const decipher = crypto.createDecipheriv(algorithm, getKey(), iv);
  return Buffer.concat([decipher.update(encryptedBuffer), decipher.final()]);
};

const encryptFile = (inputPath, outputPath) => {
  return new Promise((resolve, reject) => {
    try {
      const buffer = fs.readFileSync(inputPath);
      const { encrypted, iv } = encryptBuffer(buffer);
      fs.writeFileSync(outputPath, encrypted);
      fs.writeFileSync(outputPath + '.iv', iv);
      fs.unlinkSync(inputPath);
      resolve();
    } catch (err) { reject(err); }
  });
};

const decryptFile = (inputPath, outputPath) => {
  return new Promise((resolve, reject) => {
    try {
      const encrypted = fs.readFileSync(inputPath);
      const iv = fs.readFileSync(inputPath + '.iv');
      const decrypted = decryptBuffer(encrypted, iv);
      fs.writeFileSync(outputPath, decrypted);
      resolve();
    } catch (err) { reject(err); }
  });
};

module.exports = { encryptBuffer, decryptBuffer, encryptFile, decryptFile };
