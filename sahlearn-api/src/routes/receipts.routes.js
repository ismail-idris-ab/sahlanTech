// sahlearn-api/src/routes/receipts.routes.js — PUBLIC. No auth middleware here.
const express = require('express');
const router = express.Router();
const { receiptReadLimiter, receiptPdfLimiter } = require('../middleware/rateLimit');
const { getPublicReceipt, getPublicReceiptPdf } = require('../controllers/receipts.controller');

router.get('/:token', receiptReadLimiter, getPublicReceipt);
router.get('/:token/pdf', receiptPdfLimiter, getPublicReceiptPdf);

module.exports = router;
