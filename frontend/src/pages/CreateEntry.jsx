import { useForm, useFieldArray } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useState } from 'react';
import { createReimbursement } from '../services/api';

const CURRENCY_OPTIONS = ['USD', 'SGD', 'PKR', 'EUR', 'GBP', 'AED', 'SAR', 'CAD', 'AUD'];

export default function CreateEntry() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      expenses: [{ vendor: '', currency: 'USD', amount: '', tax: 0, pkrAmount: '' }],
      accountDetails: { accountHolder: '', bank: '', accountNumber: '' },
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'expenses',
  });

  const onSubmit = async (data) => {
    try {
      setSubmitting(true);
      // Convert string numbers to actual numbers
      const payload = {
        ...data,
        expenses: data.expenses.map((e) => ({
          ...e,
          amount: parseFloat(e.amount) || 0,
          tax: parseFloat(e.tax) || 0,
          pkrAmount: parseFloat(e.pkrAmount) || 0,
        })),
      };
      await createReimbursement(payload);
      toast.success('Reimbursement entry created successfully!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create entry');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Create New Entry</h2>
        <Link
          to="/"
          className="text-gray-600 hover:text-gray-800 font-medium transition"
        >
          ← Back to Dashboard
        </Link>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Date */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-700 mb-4 border-b pb-2">
            Letter Information
          </h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              {...register('date', { required: 'Date is required' })}
              className="w-full md:w-64 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-600"
            />
            {errors.date && (
              <p className="text-red-500 text-xs mt-1">{errors.date.message}</p>
            )}
          </div>
        </div>

        {/* Expenses */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4 border-b pb-2">
            <h3 className="text-lg font-semibold text-gray-700">
              Expenses
            </h3>
            <button
              type="button"
              onClick={() =>
                append({ vendor: '', currency: 'USD', amount: '', tax: 0, pkrAmount: '' })
              }
              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm font-medium transition cursor-pointer"
            >
              + Add Row
            </button>
          </div>

          {fields.length === 0 && (
            <p className="text-red-500 text-sm">At least one expense is required.</p>
          )}

          <div className="space-y-4">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="border border-gray-200 rounded-md p-4 bg-gray-50"
              >
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-medium text-gray-600">
                    Expense #{index + 1}
                  </span>
                  {fields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="text-red-500 hover:text-red-700 text-sm font-medium cursor-pointer"
                    >
                      ✕ Remove
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                  {/* Vendor */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Vendor <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Microsoft"
                      {...register(`expenses.${index}.vendor`, {
                        required: 'Vendor is required',
                      })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
                    />
                    {errors.expenses?.[index]?.vendor && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.expenses[index].vendor.message}
                      </p>
                    )}
                  </div>

                  {/* Currency */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Currency <span className="text-red-500">*</span>
                    </label>
                    <select
                      {...register(`expenses.${index}.currency`, {
                        required: 'Currency is required',
                      })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
                    >
                      {CURRENCY_OPTIONS.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    {errors.expenses?.[index]?.currency && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.expenses[index].currency.message}
                      </p>
                    )}
                  </div>

                  {/* Amount */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Amount <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      {...register(`expenses.${index}.amount`, {
                        required: 'Amount is required',
                        min: { value: 0.01, message: 'Must be > 0' },
                      })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
                    />
                    {errors.expenses?.[index]?.amount && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.expenses[index].amount.message}
                      </p>
                    )}
                  </div>

                  {/* Tax */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Tax
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0"
                      {...register(`expenses.${index}.tax`)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
                    />
                  </div>

                  {/* PKR Amount */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      PKR Amount
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      {...register(`expenses.${index}.pkrAmount`)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Account Details */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-700 mb-4 border-b pb-2">
            Account Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Account Holder <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Full Name"
                {...register('accountDetails.accountHolder', {
                  required: 'Account holder is required',
                })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-600"
              />
              {errors.accountDetails?.accountHolder && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.accountDetails.accountHolder.message}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bank Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Bank Name"
                {...register('accountDetails.bank', {
                  required: 'Bank name is required',
                })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-600"
              />
              {errors.accountDetails?.bank && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.accountDetails.bank.message}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Account Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Account Number"
                {...register('accountDetails.accountNumber', {
                  required: 'Account number is required',
                })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-600"
              />
              {errors.accountDetails?.accountNumber && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.accountDetails.accountNumber.message}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <Link
            to="/"
            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 font-medium transition"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="bg-green-700 hover:bg-green-800 text-white px-6 py-2 rounded-md font-medium transition disabled:opacity-50 cursor-pointer"
          >
            {submitting ? 'Saving...' : 'Submit Entry'}
          </button>
        </div>
      </form>
    </div>
  );
}
