const dotenv = require('dotenv');
const mongoose = require('mongoose');
const User = require('./models/User');

dotenv.config();

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const admin = await User.create({
      nom: 'Admin',
      prenom: 'Super',
      email: 'admin@smartmatch.test',
      password: 'Admin123!',
      role: 'admin',
      isVerified: true,
      isActive: true,
    });
    console.log('   Admin créé :', admin.email);
    process.exit(0);
  } catch (error) {
    console.error('  Erreur de création admin :', error.message);
    process.exit(1);
  }
};

createAdmin();