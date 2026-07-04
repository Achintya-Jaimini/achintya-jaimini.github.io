const contactHandler = require('../api/contact.js');

module.exports = function setupProxy(app) {
  app.use('/api/contact', (req, res) => {
    contactHandler(req, res);
  });
};
