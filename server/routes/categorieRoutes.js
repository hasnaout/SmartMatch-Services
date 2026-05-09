const express = require('express');
const router  = express.Router();
const {
  getCategories, getCategoriesActives,
  creerCategorie, updateCategorie, supprimerCategorie,
} = require('../controllers/categorieController');
const { protect }        = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

router.get('/actives', getCategoriesActives);
router.get('/',        protect, authorizeRoles('admin'), getCategories);
router.post('/',       protect, authorizeRoles('admin'), creerCategorie);
router.put('/:id',     protect, authorizeRoles('admin'), updateCategorie);
router.delete('/:id',  protect, authorizeRoles('admin'), supprimerCategorie);

module.exports = router;