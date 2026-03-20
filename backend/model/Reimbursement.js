const mongoose = require('mongoose');
const SUPPORTED_CURRENCIES = ['USD', 'SGD', 'PKR', 'EUR', 'GBP', 'AED', 'SAR', 'CAD', 'AUD'];
const SUPPORTED_ALIGNMENTS = ['left', 'center', 'right'];

const expenseSchema = new mongoose.Schema({
  vendor: {
    type: String,
    required: [true, 'Vendor name is required'],
    trim: true,
    maxlength: [120, 'Vendor name cannot exceed 120 characters'],
  },
  currency: {
    type: String,
    required: [true, 'Currency is required'],
    trim: true,
    uppercase: true,
    enum: {
      values: SUPPORTED_CURRENCIES,
      message: 'Unsupported currency',
    },
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0.01, 'Amount must be greater than 0'],
  },
  tax: {
    type: Number,
    default: 0,
    min: [0, 'Tax cannot be negative'],
  },
  pkrAmount: {
    type: Number,
    default: 0,
    min: [0, 'PKR Amount cannot be negative'],
  },
});

const accountDetailsSchema = new mongoose.Schema(
  {
    accountHolder: {
      type: String,
      required: [true, 'Account holder name is required'],
      trim: true,
      maxlength: [120, 'Account holder name cannot exceed 120 characters'],
    },
    bank: {
      type: String,
      required: [true, 'Bank name is required'],
      trim: true,
      maxlength: [120, 'Bank name cannot exceed 120 characters'],
    },
    accountNumber: {
      type: String,
      required: [true, 'Account number is required'],
      trim: true,
      match: [/^[A-Za-z0-9-]{6,34}$/, 'Account number must be 6-34 alphanumeric characters'],
    },
  },
  { _id: false }
);

const stampPlacementSchema = new mongoose.Schema(
  {
    stamp: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Stamp',
      required: [true, 'Stamp is required'],
    },
    alignment: {
      type: String,
      enum: SUPPORTED_ALIGNMENTS,
      default: 'right',
    },
    lineWidthMm: {
      type: Number,
      min: [40, 'Line width must be at least 40mm'],
      max: [120, 'Line width cannot exceed 120mm'],
      default: 62,
    },
    spacingBeforeMm: {
      type: Number,
      min: [0, 'Spacing cannot be negative'],
      max: [80, 'Spacing cannot exceed 80mm'],
      default: 0,
    },
    order: {
      type: Number,
      min: [0, 'Order cannot be negative'],
      default: 0,
    },
  },
  { _id: false }
);

const reimbursementSchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: [true, 'Date is required'],
    },
    subject: {
      type: String,
      default: 'Request for Reimbursement',
      trim: true,
      maxlength: [200, 'Subject cannot exceed 200 characters'],
    },
    expenses: {
      type: [expenseSchema],
      validate: {
        validator: (v) => v.length > 0,
        message: 'At least one expense is required',
      },
    },
    accountDetails: {
      type: accountDetailsSchema,
      required: [true, 'Account details are required'],
    },
    stampPlacements: {
      type: [stampPlacementSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Virtual for total PKR amount
reimbursementSchema.virtual('totalPkrAmount').get(function () {
  return this.expenses.reduce((sum, exp) => sum + (exp.pkrAmount || 0), 0);
});

reimbursementSchema.set('toJSON', { virtuals: true });
reimbursementSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Reimbursement', reimbursementSchema);
