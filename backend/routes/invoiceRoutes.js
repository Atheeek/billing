const express = require('express');
const { createInvoice } = require('../controllers/createInvoice');
const Invoice = require('../models/invoice');

const router = express.Router();

router.post('/', createInvoice);

router.get('/', async (req, res) => {
  try {
    const invoices = await Invoice.find().sort({ createdAt: -1 });
    res.json(invoices);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching invoices', error: error.message });
  }
});

module.exports = router;
