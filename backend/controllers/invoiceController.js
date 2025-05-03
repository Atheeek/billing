const Invoice = require('../models/invoice');

exports.createInvoice = async (req, res) => {
    try {
      const currentYear = new Date().getFullYear();
      const yearInvoicesCount = await Invoice.countDocuments({
        createdAt: {
          $gte: new Date(`${currentYear}-01-01T00:00:00.000Z`),
          $lte: new Date(`${currentYear}-12-31T23:59:59.999Z`),
        }
      });
  
      const invoiceNumber = `INV-${currentYear}-${String(yearInvoicesCount + 1).padStart(4, '0')}`;
  
      const invoice = new Invoice({ invoiceNumber, ...req.body });
      await invoice.save();
      
      res.status(201).json(invoice);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
  