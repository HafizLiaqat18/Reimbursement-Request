const express = require('express');
const router = express.Router();
const {
  createReimbursement,
  getAllReimbursements,
  getReimbursement,
  deleteReimbursement,
} = require('../controller/reimbursementController');

router.route('/').post(createReimbursement).get(getAllReimbursements);
router.route('/:id').get(getReimbursement).delete(deleteReimbursement);

module.exports = router;
