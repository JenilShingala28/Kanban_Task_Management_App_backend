const fs = require("fs");
const path = require("path");
const { destination, filename } = require("../middlewares/multer");
const { convertBase64ToFileObject } = require("../helpers/base64TofileObject");

const base64ToFileMiddleware = (fields, folder = "others") => {
  return async (req, res, next) => {
    try {
      for (const field of fields) {
        const value = req.body[field];
        if (!value) continue;

        if (typeof value === "string" && value.startsWith("data:")) {
          const file = convertBase64ToFileObject(value, field);
          if (file) {
            file.folder = folder;
            const savedFile = await saveWithMulterStorage(req, file);
            req.body[field] = savedFile.url;
            console.log("Raw base64 input for field:", field, req.body[field]);
            console.log("File object:", file);
          }
        } else if (Array.isArray(value)) {
          const savedFiles = await Promise.all(
            value
              .filter((v) => typeof v === "string" && v.startsWith("data:"))
              .map(async (v) => {
                const file = convertBase64ToFileObject(v, field);
                if (file) {
                  file.folder = folder;
                  const saved = await saveWithMulterStorage(req, file);
                  return saved.url;
                }
                return null;
              })
          );
          req.body[field] = savedFiles.filter(Boolean);
        } else if (typeof value === "object" && value !== null) {
          const base64Entry = Object.entries(value).find(
            ([_, v]) => typeof v === "string" && v.startsWith("data:")
          );
          if (base64Entry) {
            const [key, base64Str] = base64Entry;
            const file = convertBase64ToFileObject(base64Str, field);
            if (file) {
              file.folder = folder;
              const savedFile = await saveWithMulterStorage(req, file);
              req.body[field] = savedFile.url;
            }
          }
        }
      }

      next();
    } catch (err) {
      console.error("Base64 conversion error:", err);
      return res.status(500).json({
        status: false,
        message: "Base64 image conversion failed",
      });
    }
  };
};

const saveWithMulterStorage = async (req, file) => {
  const generatedFilename = await new Promise((resolve, reject) => {
    filename(req, file, (err, name) => {
      if (err) reject(err);
      else resolve(name);
    });
  });

  const destPath = await new Promise((resolve, reject) => {
    destination(req, file, (err, dest) => {
      if (err) reject(err);
      else resolve(dest);
    });
  });

  const filepath = path.join(destPath, generatedFilename);
  fs.writeFileSync(filepath, file.buffer);

  return {
    filename: generatedFilename,
    mimetype: file.mimetype,
    size: file.buffer.length,
    path: filepath,
    url: `/uploads/${file.folder}/${generatedFilename}`,
  };
};

module.exports = { base64ToFileMiddleware };
