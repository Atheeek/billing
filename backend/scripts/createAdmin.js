const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  role: String
});

const User = mongoose.model('User', userSchema);

const createAdmin = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/yourdb', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    // Delete existing admin user
    await User.deleteOne({ username: 'admin' });
    console.log('Old admin user deleted (if it existed).');

    // Create a new admin user
    const newAdmin = new User({
      username: 'admin',
      password: 'newAdmin123', // change password here
      role: 'admin'
    });

    await newAdmin.save();
    console.log('New admin user created!');

    await mongoose.connection.close();
  } catch (err) {
    console.error('Error:', err);
  }
};

createAdmin();
