const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const userRoutes = require('./routes/userRoutes.js');
const invoiceRoutes = require('./routes/invoiceRoutes.js'); // Import the invoice routes

const app = express();
app.use(cors());
app.use(express.json());  // Middleware to parse JSON bodies

// Routes
app.use('/api/users', userRoutes);
app.use('/api/invoices', invoiceRoutes);  // Add the invoices route

// Connect to MongoDB
mongoose.connect('mongodb+srv://atheek163:CbxxzfYLPyTQxRUq@billingcollection.padu26t.mongodb.net/billingdata', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Could not connect to MongoDB:', err));

// Start the server
app.listen(5000, () => {
  console.log('Server is running on http://localhost:5000');
});
