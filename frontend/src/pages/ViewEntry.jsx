import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import html2pdf from 'html2pdf.js';
import { getReimbursement } from '../services/api';
import { exportToDocx } from '../utils/docxExport';
import { formatDate } from '../utils/formatters';
import LetterTemplate from '../components/LetterTemplate';

export default function ViewEntry() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generatingDocx, setGeneratingDocx] = useState(false);
  const letterRef = useRef();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await getReimbursement(id);
        setData(res.data.data);
      } catch (err) {
        toast.error('Failed to load reimbursement');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleDownloadPDF = () => {
    const element = letterRef.current;
    const opt = {
      margin: 0,
      filename: `Reimbursement_${formatDate(data.date).replace(/ /g, '_')}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    };
    html2pdf().set(opt).from(element).save();
    toast.success('PDF download started');
  };

  const handleDownloadDocx = async () => {
    try {
      setGeneratingDocx(true);
      await exportToDocx(data);
      toast.success('Word document downloaded');
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate Word document');
    } finally {
      setGeneratingDocx(false);
    }
  };

  const handlePrint = () => {
    const letterEl = letterRef.current?.firstChild;
    if (!letterEl) return;

    // Replace relative image URL with absolute so the new window can load it
    const origin = window.location.origin;
    const html = letterEl.outerHTML
      .replaceAll('url(/top-letter-head.png)', `url(${origin}/top-letter-head.png)`)
      .replaceAll('url(/bottom-letter-head.png)', `url(${origin}/bottom-letter-head.png)`);

    const win = window.open('', '_blank', 'width=900,height=1100');
    win.document.write(`<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Reimbursement Letter</title>
    <style>
      @page { size: A4 portrait; margin: 0; }
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body {
        width: 210mm;
        height: 297mm;
        overflow: hidden;
        background: white;
      }
      .letter-body {
        width: 210mm !important;
        height: 297mm !important;
        overflow: hidden !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
    </style>
  </head>
  <body>${html}</body>
</html>`);
    win.document.close();

    // Wait for the background image to load, then print
    win.onload = () => {
      win.focus();
      win.print();
      win.close();
    };

    // Fallback if onload doesn't fire (some browsers)
    setTimeout(() => {
      try { win.print(); win.close(); } catch (_) {}
    }, 1200);
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
        <Link
          to="/"
          className="text-gray-600 hover:text-gray-800 font-medium transition"
        >
          ← Back to Dashboard
        </Link>

        <div className="flex gap-2 flex-wrap">
          <button
            onClick={handleDownloadPDF}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition cursor-pointer"
          >
            📄 Download PDF
          </button>

          <button
            onClick={handleDownloadDocx}
            disabled={generatingDocx}
            className="bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white px-4 py-2 rounded-md text-sm font-medium transition cursor-pointer"
          >
            {generatingDocx ? '⏳ Generating...' : '📝 Download Word'}
          </button>

          <button
            onClick={handlePrint}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium transition cursor-pointer"
          >
            🖨️ Print
          </button>
        </div>
      </div>

      {/* Letter Preview */}
      <div className="flex justify-center">
        <div ref={letterRef}>
          <LetterTemplate data={data} />
        </div>
      </div>
    </div>
  );
}
