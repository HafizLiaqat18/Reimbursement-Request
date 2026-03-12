import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getAllReimbursements, deleteReimbursement } from '../services/api';
import { exportToDocx } from '../utils/docxExport';
import { formatDateShort, formatCurrency } from '../utils/formatters';

export default function Dashboard() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await getAllReimbursements();
      setData(res.data.data);
    } catch (err) {
      toast.error('Failed to fetch reimbursements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this entry?')) return;
    try {
      await deleteReimbursement(id);
      toast.success('Entry deleted successfully');
      fetchData();
    } catch (err) {
      toast.error('Failed to delete entry');
    }
  };

  const handleWord = async (item) => {
    try {
      setDownloadingId(item._id);
      await exportToDocx(item);
      toast.success('Word document downloaded');
    } catch (err) {
      toast.error('Failed to generate Word document');
    } finally {
      setDownloadingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-800"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>
        <Link
          to="/create"
          className="bg-green-700 hover:bg-green-800 text-white px-5 py-2 rounded-md font-medium transition"
        >
          + New Entry
        </Link>
      </div>

      {data.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-lg">No reimbursement entries found.</p>
          <p className="mt-2">Click &quot;New Entry&quot; to create one.</p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="w-full text-sm text-left">
            <thead className="bg-green-800 text-white">
              <tr>
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Account Holder</th>
                <th className="px-4 py-3 text-right">Total Amount (PKR)</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.map((item, idx) => {
                const total = item.expenses.reduce(
                  (sum, e) => sum + (e.pkrAmount || 0),
                  0
                );
                return (
                  <tr key={item._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-600">{idx + 1}</td>
                    <td className="px-4 py-3">{formatDateShort(item.date)}</td>
                    <td className="px-4 py-3 font-medium">
                      {item.accountDetails.accountHolder}
                    </td>
                    <td className="px-4 py-3 text-right font-mono">
                      {formatCurrency(total)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center gap-2 flex-wrap">
                        <Link
                          to={`/view/${item._id}`}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs font-medium transition"
                        >
                          View
                        </Link>
                        <button
                          onClick={() => handleWord(item)}
                          disabled={downloadingId === item._id}
                          className="bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white px-3 py-1 rounded text-xs font-medium transition cursor-pointer"
                        >
                          {downloadingId === item._id ? '...' : 'Word'}
                        </button>
                        <button
                          onClick={() => handleDelete(item._id)}
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs font-medium transition cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
