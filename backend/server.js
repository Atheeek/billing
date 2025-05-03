const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const userRoutes = require('./routes/userRoutes.js');
const invoiceRoutes = require('./routes/invoiceRoutes.js');
require('dotenv').config(); // Load .env variables

const app = express();

// CORS configuration to allow Vercel frontend
const allowedOrigins = [
  'https://billing-juo62pm6y-atheeks-projects-bad38512.vercel.app',
  'https://billing-git-main-atheeks-projects-bad38512.vercel.app',
  'http://localhost:5173',
  'https://billing-m6vq9w44l-atheeks-projects-bad38512.vercel.app',
  'https://billing-nquy0sgnl-atheeks-projects-bad38512.vercel.app',
  'https://billing-nquy0sgnl-atheeks-projects-bad38512.vercel.app',
  'https://billing-iqkf0ooak-atheeks-projects-bad38512.vercel.app',
  'https://billing-bywxr4528-atheeks-projects-bad38512.vercel.app',
  'https://billing-5quk6iep0-atheeks-projects-bad38512.vercel.app'
   // for local dev if needed
];



app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());

// Routes
app.use('/api/users', userRoutes);
app.use('/api/invoices', invoiceRoutes);

// Connect to MongoDB using environment variable
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('Could not connect to MongoDB:', err));

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
