import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { createStamp, deleteStamp, getAllStamps, getErrorMessage } from '../services/api';

const ALIGNMENT_OPTIONS = ['left', 'center', 'right'];

const initialForm = {
  name: '',
  title: '',
  department: '',
  organization: 'Punjab Sahulat Bazaars Authority',
  defaultAlignment: 'right',
  defaultLineWidthMm: 62,
};

export default function StampManager() {
  const [stamps, setStamps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(initialForm);

  const loadStamps = async () => {
    try {
      setLoading(true);
      const res = await getAllStamps();
      setStamps(res.data.data || []);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to load stamps'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStamps();
  }, []);

  const handleCreate = async (event) => {
    event.preventDefault();
    try {
      setSaving(true);
      await createStamp({
        ...form,
        defaultLineWidthMm: Number(form.defaultLineWidthMm),
      });
      toast.success('Stamp created');
      setForm(initialForm);
      await loadStamps();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to create stamp'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this stamp?')) return;
    try {
      await deleteStamp(id);
      toast.success('Stamp deleted');
      await loadStamps();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to delete stamp'));
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Stamp Manager</h2>
          <p className="text-sm text-gray-500">
            Maintain approval designations used in reimbursement letters
          </p>
        </div>
        <Link to="/create" className="text-gray-600 hover:text-gray-800 font-medium transition">
          ← Back to Create Entry
        </Link>
      </div>

      <form onSubmit={handleCreate} className="bg-white p-6 rounded-lg shadow space-y-4">
        <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">Create Stamp</h3>
        <p className="text-xs text-gray-500">
          Define designation, department, and default layout hints. These can be adjusted per letter.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="Stamp Name (e.g. assistant-director)"
            className="w-full border border-gray-300 rounded-md px-3 py-2"
            required
          />
          <input
            value={form.title}
            onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
            placeholder="Title"
            className="w-full border border-gray-300 rounded-md px-3 py-2"
            required
          />
          <input
            value={form.department}
            onChange={(e) => setForm((prev) => ({ ...prev, department: e.target.value }))}
            placeholder="Department (optional)"
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          />
          <input
            value={form.organization}
            onChange={(e) => setForm((prev) => ({ ...prev, organization: e.target.value }))}
            placeholder="Organization"
            className="w-full border border-gray-300 rounded-md px-3 py-2"
            required
          />
          <select
            value={form.defaultAlignment}
            onChange={(e) => setForm((prev) => ({ ...prev, defaultAlignment: e.target.value }))}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          >
            {ALIGNMENT_OPTIONS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <input
            type="number"
            min={40}
            max={120}
            value={form.defaultLineWidthMm}
            onChange={(e) => setForm((prev) => ({ ...prev, defaultLineWidthMm: e.target.value }))}
            placeholder="Line width (mm)"
            className="w-full border border-gray-300 rounded-md px-3 py-2"
          />
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="bg-green-700 hover:bg-green-800 text-white px-5 py-2 rounded-md font-medium transition disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Create Stamp'}
          </button>
        </div>
      </form>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-700 border-b pb-2 mb-4">Saved Stamps</h3>
        {loading ? (
          <p className="text-gray-500">Loading stamps...</p>
        ) : stamps.length === 0 ? (
          <p className="text-gray-500">No stamps found.</p>
        ) : (
          <div className="space-y-3">
            {stamps.map((stamp) => (
              <div
                key={stamp._id}
                className="border border-gray-200 rounded-md p-4 flex justify-between gap-4 items-start"
              >
                <div>
                  <p className="font-semibold text-gray-800">{stamp.name}</p>
                  <p className="text-sm text-gray-700">{stamp.title}</p>
                  {stamp.department && <p className="text-sm text-gray-600">{stamp.department}</p>}
                  <p className="text-sm text-gray-600">{stamp.organization}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    align: {stamp.defaultAlignment}, line: {stamp.defaultLineWidthMm}mm
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(stamp._id)}
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs font-medium"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
