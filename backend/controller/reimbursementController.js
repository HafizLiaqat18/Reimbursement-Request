const Reimbursement = require('../model/Reimbursement');
const mongoose = require('mongoose');
const Stamp = require('../model/Stamp');

const parsePositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const toMoney = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const normalizeExpense = (expense) => ({
  vendor: String(expense.vendor || '').trim(),
  currency: String(expense.currency || '').trim().toUpperCase(),
  amount: toMoney(expense.amount),
  tax: toMoney(expense.tax),
  pkrAmount: toMoney(expense.pkrAmount),
});

const normalizeStampPlacement = (placement, index) => ({
  stamp: String(placement.stamp || '').trim(),
  alignment: String(placement.alignment || 'right').trim().toLowerCase(),
  lineWidthMm: Number(placement.lineWidthMm),
  spacingBeforeMm: Number(placement.spacingBeforeMm),
  order: Number.isFinite(Number(placement.order)) ? Number(placement.order) : index,
});

const validateCreatePayload = (payload) => {
  if (!payload.date || Number.isNaN(new Date(payload.date).getTime())) {
    return 'A valid date is required';
  }

  if (!Array.isArray(payload.expenses) || payload.expenses.length === 0) {
    return 'At least one expense is required';
  }

  if (
    !payload.accountDetails ||
    !payload.accountDetails.accountHolder ||
    !payload.accountDetails.bank ||
    !payload.accountDetails.accountNumber
  ) {
    return 'All account details are required';
  }

  if (payload.stampPlacements && !Array.isArray(payload.stampPlacements)) {
    return 'Stamp placements must be an array';
  }

  if (Array.isArray(payload.stampPlacements)) {
    for (const placement of payload.stampPlacements) {
      if (!placement.stamp) return 'Each stamp placement must include a stamp';
      if (!['left', 'center', 'right'].includes(placement.alignment)) {
        return 'Stamp alignment must be left, center, or right';
      }
    }
  }

  return null;
};

// @desc    Create a new reimbursement
// @route   POST /api/reimbursements
const createReimbursement = async (req, res) => {
  try {
    const { date, subject, expenses, accountDetails } = req.body;
    const normalizedPlacements = Array.isArray(req.body?.stampPlacements)
      ? req.body.stampPlacements
          .map((placement, index) => normalizeStampPlacement(placement, index))
          .filter((placement) => placement.stamp)
      : [];

    const payload = {
      date,
      subject: subject ? String(subject).trim() : undefined,
      expenses: Array.isArray(expenses) ? expenses.map(normalizeExpense) : [],
      accountDetails: {
        accountHolder: String(accountDetails?.accountHolder || '').trim(),
        bank: String(accountDetails?.bank || '').trim(),
        accountNumber: String(accountDetails?.accountNumber || '').trim(),
      },
      stampPlacements: normalizedPlacements,
    };

    const validationError = validateCreatePayload(payload);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    if (payload.stampPlacements.length > 0) {
      const stampIds = [...new Set(payload.stampPlacements.map((item) => item.stamp))];
      const invalidId = stampIds.some((id) => !mongoose.Types.ObjectId.isValid(id));
      if (invalidId) {
        return res.status(400).json({ message: 'One or more selected stamps are invalid' });
      }

      const existingCount = await Stamp.countDocuments({ _id: { $in: stampIds } });
      if (existingCount !== stampIds.length) {
        return res.status(400).json({ message: 'One or more selected stamps do not exist' });
      }
    }

    const reimbursement = await Reimbursement.create(payload);
    const populated = await Reimbursement.findById(reimbursement._id).populate(
      'stampPlacements.stamp',
      'name title department organization defaultAlignment defaultLineWidthMm'
    );

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    console.error('Create reimbursement failed:', error.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// @desc    Get all reimbursements
// @route   GET /api/reimbursements
const getAllReimbursements = async (req, res) => {
  try {
    const page = parsePositiveInt(req.query.page, 1);
    const limit = Math.min(parsePositiveInt(req.query.limit, 20), 100);
    const skip = (page - 1) * limit;

    const [reimbursements, total] = await Promise.all([
      Reimbursement.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('stampPlacements.stamp', 'name title department organization defaultAlignment defaultLineWidthMm'),
      Reimbursement.countDocuments(),
    ]);

    res.status(200).json({
      success: true,
      data: reimbursements,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  } catch (error) {
    console.error('Get reimbursements failed:', error.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// @desc    Get single reimbursement
// @route   GET /api/reimbursements/:id
const getReimbursement = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid reimbursement id' });
    }

    const reimbursement = await Reimbursement.findById(req.params.id).populate(
      'stampPlacements.stamp',
      'name title department organization defaultAlignment defaultLineWidthMm'
    );

    if (!reimbursement) {
      return res.status(404).json({ message: 'Reimbursement not found' });
    }

    res.status(200).json({ success: true, data: reimbursement });
  } catch (error) {
    console.error('Get reimbursement failed:', error.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// @desc    Delete reimbursement
// @route   DELETE /api/reimbursements/:id
const deleteReimbursement = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid reimbursement id' });
    }

    const reimbursement = await Reimbursement.findByIdAndDelete(req.params.id);

    if (!reimbursement) {
      return res.status(404).json({ message: 'Reimbursement not found' });
    }

    res.status(200).json({ success: true, message: 'Reimbursement deleted' });
  } catch (error) {
    console.error('Delete reimbursement failed:', error.message);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  createReimbursement,
  getAllReimbursements,
  getReimbursement,
  deleteReimbursement,
};
