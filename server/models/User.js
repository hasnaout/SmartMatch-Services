const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    nom: {
      type: String,
      required: [true, 'Le nom est obligatoire'],
      trim: true,
    },
    prenom: {
      type: String,
      required: [true, 'Le prénom est obligatoire'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email obligatoire'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Mot de passe obligatoire'],
      minlength: 6,
      select: false,
    },
    role: {
      type: String,
      enum: ['client', 'prestataire', 'admin'],
      default: 'client',
    },
    telephone: {
      type: String,
      trim: true,
    },
    avatar: {
      type: String,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    resetCode: {
      type: String,
      select: false,
    },
    resetCodeExpire: {
      type: Date,
      select: false,
    },

    demandeSuppressionStatut: {
      type: String,
      enum: ['en_attente', 'refusee', null],
      default: null,
    },
    demandeSuppressionRaison: {
      type: String,
      default: null,
      trim: true,
    },
    demandeSuppressionDate: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.comparePassword = async function (passwordSaisi) {
  return await bcrypt.compare(passwordSaisi, this.password);
};

module.exports = mongoose.model('User', userSchema);
