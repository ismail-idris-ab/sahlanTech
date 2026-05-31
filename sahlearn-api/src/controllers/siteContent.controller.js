const SiteContent = require('../models/SiteContent');
const { success } = require('../utils/apiResponse');

const ALLOWED_KEYS = ['about', 'faq', 'testimonials'];

const getContent = async (req, res) => {
  const { key } = req.params;
  if (!ALLOWED_KEYS.includes(key)) {
    return res.status(404).json({ status: 'error', message: 'Content not found' });
  }
  const doc = await SiteContent.findOne({ key }).lean();
  success(res, doc ? doc.data : {});
};

const upsertContent = async (req, res) => {
  const { key } = req.params;
  if (!ALLOWED_KEYS.includes(key)) {
    return res.status(404).json({ status: 'error', message: 'Content not found' });
  }
  const doc = await SiteContent.findOneAndUpdate(
    { key },
    { $set: { data: req.body } },
    { new: true, upsert: true }
  );
  success(res, doc.data);
};

module.exports = { getContent, upsertContent };
