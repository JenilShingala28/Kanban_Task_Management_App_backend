const config = (() => {
  const values = {
    PORT: process.env.PORT || 7000,
    DATABASE_KEY: process.env.DATABASE_KEY,
    JWT_SECRET: process.env.JWT_SECRET,
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,
    IMAGE_URL: process.env.IMAGE_URL,
    DEFAULT_USER_ROLE_ID: process.env.DEFAULT_USER_ROLE_ID,
  };

  return {
    get: (key) => {
      if (Object.prototype.hasOwnProperty.call(values, key)) {
        return values[key];
      }
      throw new Error(`Config key "${key}" is not defined`);
    },
  };
})();

module.exports = { config };
