const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error('Only JPEG, PNG, WEBP images allowed'));
};

exports.upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: (parseInt(process.env.MAX_FILE_SIZE_MB) || 10) * 1024 * 1024 }
});

// Compress and save image
exports.processImage = async (buffer, filename, width = 800) => {
  const outputPath = path.join(uploadDir, filename);
  await sharp(buffer)
    .resize({ width, withoutEnlargement: true })
    .jpeg({ quality: 75, progressive: true })
    .toFile(outputPath);
  return `/uploads/${filename}`;
};
