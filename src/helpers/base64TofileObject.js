const path = require("path");

const convertBase64ToFileObject = (base64String, fieldname) => {
  const match = base64String.match(/^data:(.+);base64,(.+)$/);
  if (!match) return null;

  const mimetype = match[1];
  const buffer = Buffer.from(match[2], "base64");
  const extension = mimetype.split("/")[1];
  const ext = "." + extension;
  const originalname = `${fieldname}${ext}`;

  return {
    fieldname,
    originalname,
    mimetype,
    buffer,
    extension,
  };
};

module.exports = { convertBase64ToFileObject };
