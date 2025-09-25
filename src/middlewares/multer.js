const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadPath = (folder = "others") => {
  const fullPath = path.join(__dirname, `../../public/uploads/${folder}`);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
  return fullPath;
};

const destination = (req, file, cb) => {
  const folderPath = uploadPath(file.folder || "others");
  cb(null, folderPath);
};

const filename = (req, file, cb) => {
  const ext = path.extname(file.originalname);
  const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
  cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
};

const storage = multer.diskStorage({
  destination,
  filename,
});

module.exports = {
  uploadPath,
  storage,
  destination,
  filename,
};
