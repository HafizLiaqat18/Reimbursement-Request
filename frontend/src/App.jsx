import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Dashboard from './pages/Dashboard';
import CreateEntry from './pages/CreateEntry';
import ViewEntry from './pages/ViewEntry';

function App() {
  return (
    <Router>
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-green-800 text-white shadow-md no-print">
          <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
            <h1 className="text-lg font-bold tracking-wide">
              PSBA Reimbursement Management System
            </h1>
          </div>
        </nav>
        <main className="max-w-7xl mx-auto px-4 py-6">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/create" element={<CreateEntry />} />
            <Route path="/view/:id" element={<ViewEntry />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;

