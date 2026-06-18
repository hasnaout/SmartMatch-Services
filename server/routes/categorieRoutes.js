const express = require('express');
const router  = express.Router();

const {
  getCategories,
  getCategoriesActives,
  creerCategorie,
  updateCategorie,
  supprimerCategorie,
} = require('../controllers/categorieController');

const { protect, authorize } = require('../middleware/authMiddleware');
const { validateMongoId }    = require('../middleware/demandeValidator');

// ── Public ──
// GET /api/categories/actives — liste pour le formulaire de demande
router.get('/actives', getCategoriesActives);

// ── Privé (admin) ──
// Factorisation : protect + authorize appliqués une seule fois
const adminRouter = express.Router();
adminRouter.use(protect);
adminRouter.use(authorize('admin'));

adminRouter.get   ('/',    getCategories);
adminRouter.post  ('/',    creerCategorie);
adminRouter.put   ('/:id', validateMongoId, updateCategorie);
adminRouter.delete('/:id', validateMongoId, supprimerCategorie);

// Monter le sous-router admin sur le router principal
router.use('/', adminRouter);

module.exports = router;
