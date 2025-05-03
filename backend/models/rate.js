const mongoose = require('mongoose');

const rateSchema = new mongoose.Schema({
  date: String, // "2025-04-28"
  goldRatePerGram: Number,
  silverRatePerGram: Number,
  enteredManually: { type: Boolean, default: false },
});

module.exports = mongoose.model('Rate', rateSchema);
