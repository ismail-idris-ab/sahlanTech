const { success } = require('../utils/apiResponse');

const single = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ status: 'error', message: 'No file uploaded' });
  }
  success(res, {
    url: req.file.path,
    public_id: req.file.filename,
    folder: req.query.folder || 'courses',
    bytes: req.file.size,
    width: req.file.width,
    height: req.file.height,
  });
};

module.exports = { single };
