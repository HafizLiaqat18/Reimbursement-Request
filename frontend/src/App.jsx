import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Dashboard from './pages/Dashboard';
import CreateEntry from './pages/CreateEntry';
import ViewEntry from './pages/ViewEntry';
import StampManager from './pages/StampManager';

function App() {
  return (
    <Router>
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-green-800 text-white shadow-md no-print">
          <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col gap-3 md:flex-row md:justify-between md:items-center">
            <div>
              <h1 className="text-lg font-bold tracking-wide">
                PSBA Reimbursement Management System
              </h1>
              <p className="text-xs text-green-100">
                Prepare, review, and export reimbursement letters on official letterhead
              </p>
            </div>
            <div className="flex gap-2 text-sm">
              <Link to="/" className="px-3 py-1.5 rounded bg-green-700 hover:bg-green-600 transition">
                Dashboard
              </Link>
              <Link to="/create" className="px-3 py-1.5 rounded bg-green-700 hover:bg-green-600 transition">
                New Entry
              </Link>
              <Link to="/stamps" className="px-3 py-1.5 rounded bg-green-700 hover:bg-green-600 transition">
                Stamps
              </Link>
            </div>
          </div>
        </nav>
        <main className="max-w-7xl mx-auto px-4 py-6">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/create" element={<CreateEntry />} />
            <Route path="/view/:id" element={<ViewEntry />} />
            <Route path="/stamps" element={<StampManager />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;

