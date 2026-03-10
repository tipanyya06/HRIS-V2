export const paginate = (page, limit) => {
  const p = parseInt(page, 10) || 1;
  const l = parseInt(limit, 10) || 20;
  return { skip: (p - 1) * l, limit: l, page: p };
};
