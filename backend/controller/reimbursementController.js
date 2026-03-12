const Reimbursement = require('../model/Reimbursement');

// @desc    Create a new reimbursement
// @route   POST /api/reimbursements
const createReimbursement = async (req, res) => {
  try {
    const { date, subject, expenses, accountDetails } = req.body;

    if (!expenses || expenses.length === 0) {
      return res.status(400).json({ message: 'At least one expense is required' });
    }

    if (!accountDetails || !accountDetails.accountHolder || !accountDetails.bank || !accountDetails.accountNumber) {
      return res.status(400).json({ message: 'All account details are required' });
    }

    const reimbursement = await Reimbursement.create({
      date,
      subject: subject || 'Reuqest for Reimbursement ',
      expenses,
      accountDetails,
    });

    res.status(201).json({ success: true, data: reimbursement });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all reimbursements
// @route   GET /api/reimbursements
const getAllReimbursements = async (req, res) => {
  try {
    const reimbursements = await Reimbursement.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: reimbursements });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get single reimbursement
// @route   GET /api/reimbursements/:id
const getReimbursement = async (req, res) => {
  try {
    const reimbursement = await Reimbursement.findById(req.params.id);

    if (!reimbursement) {
      return res.status(404).json({ message: 'Reimbursement not found' });
    }

    res.status(200).json({ success: true, data: reimbursement });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Reimbursement not found' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete reimbursement
// @route   DELETE /api/reimbursements/:id
const deleteReimbursement = async (req, res) => {
  try {
    const reimbursement = await Reimbursement.findByIdAndDelete(req.params.id);

    if (!reimbursement) {
      return res.status(404).json({ message: 'Reimbursement not found' });
    }

    res.status(200).json({ success: true, message: 'Reimbursement deleted' });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Reimbursement not found' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  createReimbursement,
  getAllReimbursements,
  getReimbursement,
  deleteReimbursement,
};
