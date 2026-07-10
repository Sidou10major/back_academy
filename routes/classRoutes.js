const express = require('express');
const router = express.Router();
const { createClass, getClasses, deleteClass } = require('../controllers/classController');

router.route('/')
    .post(createClass)
    .get(getClasses);

router.route('/:id')
    .delete(deleteClass);

module.exports = router;