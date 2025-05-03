const Invoice = require('../models/invoice');

exports.createInvoice = async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();
    const count = await Invoice.countDocuments({
      createdAt: {
        $gte: new Date(`${currentYear}-01-01`),
        $lte: new Date(`${currentYear}-12-31T23:59:59.999Z`)
      }
    });

    const invoiceNumber = `INV-${currentYear}-${String(count + 1).padStart(4, '0')}`;
    const invoice = new Invoice({ invoiceNumber, ...req.body });
    await invoice.save();

    res.status(201).json({ message: 'Invoice created successfully', invoice });
  } catch (error) {
    res.status(500).json({ message: 'Error creating invoice', error: error.message });
  }
};
