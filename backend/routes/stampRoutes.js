const express = require('express');
const router = express.Router();
const { createStamp, getAllStamps, deleteStamp } = require('../controller/stampController');

router.route('/').post(createStamp).get(getAllStamps);
router.route('/:id').delete(deleteStamp);

module.exports = router;
