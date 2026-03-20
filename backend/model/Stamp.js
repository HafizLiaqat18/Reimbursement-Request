const mongoose = require('mongoose');

const stampSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Stamp name is required'],
      trim: true,
      maxlength: [100, 'Stamp name cannot exceed 100 characters'],
      unique: true,
    },
    title: {
      type: String,
      required: [true, 'Stamp title is required'],
      trim: true,
      maxlength: [120, 'Stamp title cannot exceed 120 characters'],
    },
    department: {
      type: String,
      trim: true,
      maxlength: [160, 'Department cannot exceed 160 characters'],
      default: '',
    },
    organization: {
      type: String,
      required: [true, 'Organization is required'],
      trim: true,
      maxlength: [160, 'Organization cannot exceed 160 characters'],
    },
    defaultAlignment: {
      type: String,
      enum: ['left', 'center', 'right'],
      default: 'right',
    },
    defaultLineWidthMm: {
      type: Number,
      min: [40, 'Line width must be at least 40mm'],
      max: [120, 'Line width cannot exceed 120mm'],
      default: 62,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Stamp', stampSchema);
