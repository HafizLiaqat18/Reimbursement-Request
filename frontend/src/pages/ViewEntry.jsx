import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import html2pdf from 'html2pdf.js';
import { getReimbursement, getErrorMessage } from '../services/api';
import { exportToDocx, getLetterMarkup, printLetter } from '../utils/docxExport';
import { formatDate } from '../utils/formatters';
import LetterTemplate from '../components/LetterTemplate';

export default function ViewEntry() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generatingDocx, setGeneratingDocx] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getReimbursement(id);
        setData(res.data.data);
      } catch (err) {
        toast.error(getErrorMessage(err, 'Failed to load reimbursement'));
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleDownloadPDF = () => {
    const wrapper = document.createElement('div');
    wrapper.style.position = 'fixed';
    wrapper.style.left = '-99999px';
    wrapper.style.top = '0';
    wrapper.innerHTML = getLetterMarkup(data);
    document.body.appendChild(wrapper);
    const element = wrapper.firstElementChild;
    const opt = {
      margin: 0,
      filename: `Reimbursement_${formatDate(data.date).replace(/ /g, '_')}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    };
    html2pdf()
      .set(opt)
      .from(element)
      .save()
      .then(() => {
        document.body.removeChild(wrapper);
      })
      .catch(() => {
        document.body.removeChild(wrapper);
      });
    toast.success('PDF download started');
  };

  const handleDownloadDocx = async () => {
    try {
      setGeneratingDocx(true);
      await exportToDocx(data);
      toast.success('Word document downloaded');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to generate Word document'));
    } finally {
      setGeneratingDocx(false);
    }
  };

  const handlePrint = () => {
    try {
      printLetter(data);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to open print view'));
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-800"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500 text-lg">Reimbursement not found.</p>
        <Link to="/" className="text-green-700 hover:underline mt-2 inline-block">
          ← Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Action Bar — hidden in print */}
      <div className="no-print flex justify-between items-center mb-6 flex-wrap gap-3">
        <div>
          <Link
            to="/"
            className="text-gray-600 hover:text-gray-800 font-medium transition"
          >
            ← Back to Dashboard
          </Link>
          <p className="text-sm text-gray-500 mt-1">Review and export this reimbursement letter</p>
        </div>

        <div className="flex gap-2 flex-wrap">
          <button
            onClick={handleDownloadPDF}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition cursor-pointer"
          >
            Download PDF
          </button>

          <button
            onClick={handleDownloadDocx}
            disabled={generatingDocx}
            className="bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white px-4 py-2 rounded-md text-sm font-medium transition cursor-pointer"
          >
            {generatingDocx ? 'Generating...' : 'Download Word'}
          </button>

          <button
            onClick={handlePrint}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium transition cursor-pointer"
          >
            Print
          </button>
        </div>
      </div>

      {/* Letter Preview */}
      <div className="flex justify-center">
        <div>
          <LetterTemplate data={data} />
        </div>
      </div>
    </div>
  );
}
