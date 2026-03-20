const mongoose = require('mongoose');
const Stamp = require('../model/Stamp');
const Reimbursement = require('../model/Reimbursement');

const createStamp = async (req, res) => {
  try {
    const payload = {
      name: String(req.body?.name || '').trim(),
      title: String(req.body?.title || '').trim(),
      department: String(req.body?.department || '').trim(),
      organization: String(req.body?.organization || '').trim(),
      defaultAlignment: String(req.body?.defaultAlignment || 'right').trim().toLowerCase(),
      defaultLineWidthMm: Number(req.body?.defaultLineWidthMm),
    };

    if (!payload.name || !payload.title || !payload.organization) {
      return res.status(400).json({ message: 'Name, title, and organization are required' });
    }

    if (!Number.isFinite(payload.defaultLineWidthMm)) {
      delete payload.defaultLineWidthMm;
    }

    const stamp = await Stamp.create(payload);
    return res.status(201).json({ success: true, data: stamp });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'A stamp with this name already exists' });
    }
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((item) => item.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    console.error('Create stamp failed:', error.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const getAllStamps = async (req, res) => {
  try {
    const stamps = await Stamp.find().sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: stamps });
  } catch (error) {
    console.error('Get stamps failed:', error.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

const deleteStamp = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid stamp id' });
    }

    const inUseCount = await Reimbursement.countDocuments({
      'stampPlacements.stamp': req.params.id,
    });
    if (inUseCount > 0) {
      return res.status(400).json({
        message: 'This stamp is used in reimbursements and cannot be deleted',
      });
    }

    const deleted = await Stamp.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Stamp not found' });
    }

    return res.status(200).json({ success: true, message: 'Stamp deleted' });
  } catch (error) {
    console.error('Delete stamp failed:', error.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = {
  createStamp,
  getAllStamps,
  deleteStamp,
};
