const getParams = (req) => {
  const src = { ...req.query, ...req.body };

  // Parse filter
  let filter = src.filter;
  if (typeof filter === "string") {
    try {
      filter = JSON.parse(filter);
    } catch {
      filter = undefined;
    }
  }

  // Parse sort
  let sort = src.sort;
  if (typeof sort === "string") {
    try {
      sort = JSON.parse(sort);
    } catch {
      sort = undefined;
    }
  }

  return {
    page: Math.max(Number(src.page) || 1), // Default 1
    pageSize: Math.max(Number(src.pageSize) || 10), // Default 10
    search: src.search?.toString().trim() || undefined,
    filter,
    sort,
    all: src,
  };
};

module.exports = { getParams };
