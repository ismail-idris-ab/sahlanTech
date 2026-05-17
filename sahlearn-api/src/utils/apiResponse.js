const success = (res, data, statusCode = 200) =>
  res.status(statusCode).json({ status: 'success', data });

const successList = (res, data, meta) =>
  res.status(200).json({ status: 'success', data, meta });

const notFound = (res, message = 'Not found') =>
  res.status(404).json({ status: 'error', message });

module.exports = { success, successList, notFound };
