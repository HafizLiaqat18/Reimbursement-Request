import { useForm, useFieldArray } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useEffect, useState } from 'react';
import { createReimbursement, getAllStamps, getErrorMessage } from '../services/api';

const CURRENCY_OPTIONS = ['USD', 'SGD', 'PKR', 'EUR', 'GBP', 'AED', 'SAR', 'CAD', 'AUD'];
const ALIGNMENT_OPTIONS = ['left', 'center', 'right'];
const STAMP_PRESETS = {
  right_standard: { label: 'Right (standard)', alignment: 'right', lineWidthMm: 62, spacingBeforeMm: 15 },
  right_compact: { label: 'Right (compact)', alignment: 'right', lineWidthMm: 62, spacingBeforeMm: 8 },
  left_standard: { label: 'Left (standard)', alignment: 'left', lineWidthMm: 55, spacingBeforeMm: 15 },
  center_standard: { label: 'Center (standard)', alignment: 'center', lineWidthMm: 60, spacingBeforeMm: 15 },
};

export default function CreateEntry() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [stamps, setStamps] = useState([]);
  const [showAdvancedStampControls, setShowAdvancedStampControls] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      subject: 'Request for Reimbursement',
      expenses: [{ vendor: '', currency: 'USD', amount: '', tax: 0, pkrAmount: '' }],
      accountDetails: { accountHolder: '', bank: '', accountNumber: '' },
      stampPlacements: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'expenses',
  });
  const {
    fields: stampFields,
    append: appendStamp,
    remove: removeStamp,
    move: moveStamp,
    replace: replaceStampPlacements,
  } = useFieldArray({
    control,
    name: 'stampPlacements',
  });

  useEffect(() => {
    const loadStamps = async () => {
      try {
        const res = await getAllStamps();
        setStamps(res.data.data || []);
      } catch (error) {
        toast.error(getErrorMessage(error, 'Failed to load stamps'));
      }
    };
    loadStamps();
  }, []);

  const findStampByText = (keywords) =>
    stamps.find((stamp) => {
      const text = `${stamp.name} ${stamp.title} ${stamp.department || ''}`.toLowerCase();
      return keywords.some((keyword) => text.includes(keyword));
    });

  const applyDefaultApprovalChain = () => {
    const assistant = findStampByText(['assistant director']);
    const additional = findStampByText(['additional director']);
    const directorGeneral = findStampByText(['director general']);

    if (!assistant || !additional || !directorGeneral) {
      toast.error(
        'Default chain requires stamps for Assistant Director, Additional Director, and Director General'
      );
      return;
    }

    replaceStampPlacements([
      {
        stamp: assistant._id,
        preset: 'right_standard',
        alignment: 'right',
        lineWidthMm: 62,
        spacingBeforeMm: 15,
      },
      {
        stamp: additional._id,
        preset: 'right_standard',
        alignment: 'right',
        lineWidthMm: 62,
        spacingBeforeMm: 25,
      },
      {
        stamp: directorGeneral._id,
        preset: 'left_standard',
        alignment: 'left',
        lineWidthMm: 55,
        spacingBeforeMm: 25,
      },
    ]);
    toast.success('Default approval chain applied');
  };

  const watchedExpenses = watch('expenses');
  const totalPkr = (watchedExpenses || []).reduce(
    (sum, item) => sum + (Number.isFinite(item?.pkrAmount) ? item.pkrAmount : Number(item?.pkrAmount) || 0),
    0
  );

  const onSubmit = async (data) => {
    try {
      setSubmitting(true);
      // Convert string numbers to actual numbers
      const payload = {
        ...data,
        expenses: data.expenses.map((e) => ({
          ...e,
          amount: Number.isFinite(e.amount) ? e.amount : 0,
          tax: Number.isFinite(e.tax) ? e.tax : 0,
          pkrAmount: Number.isFinite(e.pkrAmount) ? e.pkrAmount : 0,
        })),
        stampPlacements: (data.stampPlacements || [])
          .filter((item) => item.stamp)
          .map((item, index) => ({
            stamp: item.stamp,
            alignment: STAMP_PRESETS[item.preset]?.alignment || item.alignment || 'right',
            lineWidthMm: STAMP_PRESETS[item.preset]?.lineWidthMm || Number(item.lineWidthMm) || 62,
            spacingBeforeMm: STAMP_PRESETS[item.preset]?.spacingBeforeMm || Number(item.spacingBeforeMm) || 0,
            order: index,
          })),
      };
      await createReimbursement(payload);
      toast.success('Reimbursement entry created successfully!');
      navigate('/');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to create entry'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Create New Entry</h2>
          <p className="text-sm text-gray-500">
            Prepare reimbursement letter details and approval chain
          </p>
        </div>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                {...register('date', { required: 'Date is required' })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-600"
              />
              {errors.date && (
                <p className="text-red-500 text-xs mt-1">{errors.date.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subject <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register('subject', { required: 'Subject is required' })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-600"
              />
              {errors.subject && (
                <p className="text-red-500 text-xs mt-1">{errors.subject.message}</p>
              )}
            </div>
          </div>
          <div className="mt-4 rounded border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
            Running total (PKR): <strong>{totalPkr.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
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
          <p className="text-xs text-gray-500 mb-4">
            Add all items/services procured for official work. PKR amount contributes to total reimbursement.
          </p>

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
                        valueAsNumber: true,
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
                      {...register(`expenses.${index}.tax`, {
                        valueAsNumber: true,
                        min: { value: 0, message: 'Cannot be negative' },
                      })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
                    />
                    {errors.expenses?.[index]?.tax && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.expenses[index].tax.message}
                      </p>
                    )}
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
                      {...register(`expenses.${index}.pkrAmount`, {
                        valueAsNumber: true,
                        min: { value: 0, message: 'Cannot be negative' },
                      })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
                    />
                    {errors.expenses?.[index]?.pkrAmount && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.expenses[index].pkrAmount.message}
                      </p>
                    )}
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
          <p className="text-xs text-gray-500 mb-4">
            Reimbursement is requested to this same account.
          </p>
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

        {/* Stamp Placements */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4 border-b pb-2">
            <h3 className="text-lg font-semibold text-gray-700">Stamp Placements</h3>
            <div className="flex gap-2">
              <Link
                to="/stamps"
                className="text-sm px-3 py-1 rounded border border-gray-300 text-gray-700 hover:bg-gray-100"
              >
                Manage Stamps
              </Link>
              <button
                type="button"
                onClick={() =>
                  appendStamp({
                    stamp: stamps[0]?._id || '',
                    preset: 'right_standard',
                    alignment: 'right',
                    lineWidthMm: 62,
                    spacingBeforeMm: 0,
                  })
                }
                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm font-medium transition"
                disabled={stamps.length === 0}
              >
                + Add Stamp
              </button>
              <button
                type="button"
                onClick={applyDefaultApprovalChain}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm font-medium transition"
                disabled={stamps.length === 0}
              >
                Apply Default Approval Chain
              </button>
            </div>
          </div>
          <p className="text-xs text-gray-500 mb-4">
            Use the default chain for standard approvals, then move stamps up/down if needed.
          </p>

          {stamps.length === 0 ? (
            <p className="text-sm text-gray-500">
              No stamps found. Create one from <strong>Manage Stamps</strong>.
            </p>
          ) : stampFields.length === 0 ? (
            <p className="text-sm text-gray-500">
              No custom stamps selected. Default signature blocks will be used.
            </p>
          ) : (
            <div className="space-y-3">
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowAdvancedStampControls((prev) => !prev)}
                  className="text-xs text-gray-600 hover:text-gray-800 underline"
                >
                  {showAdvancedStampControls ? 'Hide advanced controls' : 'Show advanced controls'}
                </button>
              </div>
              {stampFields.map((field, index) => (
                <div key={field.id} className="border border-gray-200 rounded-md p-4 bg-gray-50">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-medium text-gray-600">Stamp #{index + 1}</span>
                    <button
                      type="button"
                      onClick={() => removeStamp(index)}
                      className="text-red-500 hover:text-red-700 text-sm font-medium"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="flex gap-2 mb-3">
                    <button
                      type="button"
                      onClick={() => moveStamp(index, index - 1)}
                      disabled={index === 0}
                      className="text-xs px-2 py-1 border rounded border-gray-300 disabled:opacity-40"
                    >
                      Move Up
                    </button>
                    <button
                      type="button"
                      onClick={() => moveStamp(index, index + 1)}
                      disabled={index === stampFields.length - 1}
                      className="text-xs px-2 py-1 border rounded border-gray-300 disabled:opacity-40"
                    >
                      Move Down
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <select
                      {...register(`stampPlacements.${index}.stamp`, {
                        required: 'Stamp is required',
                      })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    >
                      {stamps.map((stamp) => (
                        <option key={stamp._id} value={stamp._id}>
                          {stamp.name} - {stamp.title}
                        </option>
                      ))}
                    </select>
                    <select
                      {...register(`stampPlacements.${index}.preset`)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    >
                      {Object.entries(STAMP_PRESETS).map(([value, item]) => (
                        <option key={value} value={value}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                    <div className="text-xs text-gray-500 flex items-center px-2">
                      Order: {index + 1}
                    </div>
                  </div>

                  {showAdvancedStampControls && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                    <select
                      {...register(`stampPlacements.${index}.alignment`)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    >
                      {ALIGNMENT_OPTIONS.map((alignment) => (
                        <option key={alignment} value={alignment}>
                          {alignment}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min={40}
                      max={120}
                      step="1"
                      placeholder="Line width (mm)"
                      {...register(`stampPlacements.${index}.lineWidthMm`, {
                        valueAsNumber: true,
                        min: { value: 40, message: 'Min 40mm' },
                        max: { value: 120, message: 'Max 120mm' },
                      })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    />
                    <input
                      type="number"
                      min={0}
                      max={80}
                      step="1"
                      placeholder="Space before (mm)"
                      {...register(`stampPlacements.${index}.spacingBeforeMm`, {
                        valueAsNumber: true,
                        min: { value: 0, message: 'Min 0' },
                        max: { value: 80, message: 'Max 80' },
                      })}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
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
