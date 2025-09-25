const dotenv = require("dotenv");
dotenv.config();
const { config } = require("../config");

const getAssetUrl = (path) => {
  const baseUrl = config.get("IMAGE_URL") || "http://localhost:7000";
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
};

module.exports = { getAssetUrl };
