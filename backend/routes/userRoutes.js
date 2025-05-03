const express = require('express');
const User = require('../models/user.js');

const router = express.Router();

router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    // Find user by username
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    // Compare the password
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    // Return success message and user info
    res.json({ message: 'Login successful', user: { username: user.username, role: user.role } });

  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
