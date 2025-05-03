const Rate = require('../models/rate');

exports.getRate = async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0,10);
    let rate = await Rate.findOne({ date: today });
    res.json(rate);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateRate = async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0,10);
    let rate = await Rate.findOneAndUpdate(
      { date: today },
      req.body,
      { new: true, upsert: true }
    );
    res.json(rate);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
