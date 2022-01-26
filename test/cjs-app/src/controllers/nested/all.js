module.exports = {
  prepareRouter: (r) => {
    r.use((req, res, next) => {
      res.append('nonsense', 'true');
      next();
    });
  },
};
