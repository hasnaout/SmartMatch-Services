const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    console.log(' Connexion avec:', process.env.MONGODB_URI?.substring(0, 30) + '...');
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(' MongoDB Connecté!');
    console.log(' DB:', conn.connection.name);
  } catch (error) {
    console.error('  Erreur MongoDB :', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;