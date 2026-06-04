const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const crypto   = require('crypto');

const userSchema = new mongoose.Schema(
  {
    nom: {
      type:      String,
      required:  [true, 'Le nom est obligatoire'],
      trim:      true,
      maxlength: [50, 'Le nom ne peut pas dépasser 50 caractères'],
    },
    prenom: {
      type:      String,
      required:  [true, 'Le prénom est obligatoire'],
      trim:      true,
      maxlength: [50, 'Le prénom ne peut pas dépasser 50 caractères'],
    },
    email: {
      type:      String,
      required:  [true, 'Email obligatoire'],
      unique:    true,   // crée déjà un index — pas besoin de .index({ email:1 }) séparé
      lowercase: true,
      trim:      true,
      match:     [/^\S+@\S+\.\S+$/, 'Veuillez fournir un email valide'],
    },
    password: {
      type:      String,
      required:  [true, 'Mot de passe obligatoire'],
      minlength: [6, 'Le mot de passe doit contenir au moins 6 caractères'],
      select:    false,
    },
    role: {
      type:    String,
      enum:    ['client', 'prestataire', 'admin'],
      default: 'client',
    },
    telephone: {
      type:  String,
      trim:  true,
      match: [
        /^(\+?\d{1,4})?[\s\-]?\(?\d{1,4}\)?[\s\-]?\d{1,4}[\s\-]?\d{1,9}$/,
        'Veuillez fournir un numéro de téléphone valide',
      ],
    },

    // CORRECTION 1 : null au lieu de '' — distinction absence vs vide
    avatar: {
      type:    String,
      default: null,
      match:   [/^https?:\/\/.+/, 'URL avatar invalide'],
    },

    isActive: {
      type:    Boolean,
      default: true,
    },
    isVerified: {
      type:    Boolean,
      default: false,
    },

    // CORRECTION 2 : resetCode hashé en base (jamais en clair)
    resetCode: {
      type:   String,
      select: false,
    },
    resetCodeExpire: {
      type:   Date,
      select: false,
    },

    loginAttempts: {
      type:    Number,
      default: 0,
      select:  false,
    },
    lockUntil: {
      type:   Date,
      select: false,
    },
  },
  {
    timestamps: true,

    // CORRECTION 3 : transform global — nettoyer la sérialisation JSON
    toJSON: {
      transform: function (doc, ret) {
        delete ret.password;
        delete ret.resetCode;
        delete ret.resetCodeExpire;
        delete ret.loginAttempts;
        delete ret.lockUntil;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// ── Index — email déjà indexé via unique:true, on garde uniquement role ──
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1, role: 1 }); // filtre admin fréquent

// ── CORRECTION 4 : pre('save') avec next() explicite + try/catch ──
userSchema.pre('save', async function (next) {
  try {
    if (!this.isModified('password')) return next();
    const salt    = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// ── Comparaison du mot de passe ──
userSchema.methods.comparePassword = async function (passwordSaisi) {
  return bcrypt.compare(passwordSaisi, this.password);
};

// ── CORRECTION 5 : génération et hachage du resetCode ──
// Retourne le code en clair (à envoyer par email) et stocke le hash
userSchema.methods.genererResetCode = function () {
  // Code à 6 chiffres lisible par l'utilisateur
  const codeEnClair = Math.floor(100000 + Math.random() * 900000).toString();

  // Hash SHA-256 — stocké en base (jamais le code en clair)
  this.resetCode = crypto
    .createHash('sha256')
    .update(codeEnClair)
    .digest('hex');

  // Expiration : 10 minutes
  this.resetCodeExpire = new Date(Date.now() + 10 * 60 * 1000);

  return codeEnClair; // retourné pour être envoyé par email
};

// Vérifier un code soumis par l'utilisateur
userSchema.methods.verifierResetCode = function (codeSoumis) {
  const hashSoumis = crypto
    .createHash('sha256')
    .update(codeSoumis)
    .digest('hex');

  return (
    this.resetCode === hashSoumis &&
    this.resetCodeExpire > Date.now()
  );
};

// ── Anti-brute-force ──
userSchema.methods.isLocked = function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

userSchema.methods.incrementLoginAttempts = async function () {
  const MAX_ATTEMPTS  = 5;
  const LOCK_DURATION = 30 * 60 * 1000;

  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $set:   { loginAttempts: 1 },
      $unset: { lockUntil: 1 },
    });
  }

  const update = { $inc: { loginAttempts: 1 } };
  if (this.loginAttempts + 1 >= MAX_ATTEMPTS) {
    update.$set = { lockUntil: Date.now() + LOCK_DURATION };
  }
  return this.updateOne(update);
};

userSchema.methods.resetLoginAttempts = async function () {
  return this.updateOne({
    $set:   { loginAttempts: 0 },
    $unset: { lockUntil: 1 },
  });
};

// ── Virtual : nom complet ──
userSchema.virtual('nomComplet').get(function () {
  return `${this.prenom} ${this.nom}`;
});

module.exports = mongoose.model('User', userSchema);