// backend/src/config/uploadConfig.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Factory for dynamic storage by folder
function createStorage(folderName) {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadPath = path.join(__dirname, '..', 'uploads', folderName);
      fs.mkdirSync(uploadPath, { recursive: true });
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, uniqueSuffix + '-' + file.originalname);
    }
  });
}

// Create uploaders per entity
const driverUpload = multer({ storage: createStorage('driver') });
const truckUpload = multer({ storage: createStorage('trucks') });
const trailerUpload = multer({ storage: createStorage('trailers') });

module.exports = {
  driverUpload,
  truckUpload,
  trailerUpload
};