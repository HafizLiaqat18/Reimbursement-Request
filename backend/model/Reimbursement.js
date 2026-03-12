const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  vendor: {
    type: String,
    required: [true, 'Vendor name is required'],
    trim: true,
  },
  currency: {
    type: String,
    required: [true, 'Currency is required'],
    trim: true,
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0, 'Amount must be positive'],
  },
  tax: {
    type: Number,
    default: 0,
    min: [0, 'Tax must be positive'],
  },
  pkrAmount: {
    type: Number,
    default: 0,
    min: [0, 'PKR Amount must be positive'],
  },
});

const accountDetailsSchema = new mongoose.Schema(
  {
    accountHolder: {
      type: String,
      required: [true, 'Account holder name is required'],
      trim: true,
    },
    bank: {
      type: String,
      required: [true, 'Bank name is required'],
      trim: true,
    },
    accountNumber: {
      type: String,
      required: [true, 'Account number is required'],
      trim: true,
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
      default: 'Reuqest for Reimbursement ',
      trim: true,
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
