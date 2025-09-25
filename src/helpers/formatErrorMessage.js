const formatErrorMessage = (message) => {
  return message
    .replace(/\"/g, "") // Remove double quotes
    .replace(/\\+/g, "") // Remove backslashes
    .replace(/;/g, ",") // Replace semicolons with commas
    .replace(/(^\w)/, (c) => c.toUpperCase()); // Capitalize first letter
};

module.exports = {
  formatErrorMessage,
};
