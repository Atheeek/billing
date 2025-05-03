import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import CreateInvoice from './pages/CreateInvoice';  // Import CreateInvoice page
import ViewInvoices from './pages/ViewInvoices';    // Import ViewInvoices page
import UpdateRates from './pages/UpdateRates';      // Import UpdateRates page
import ProtectedRoute from './components/ProtectedRoute';

const App = () => {
  return (
    <Router>
      <Routes>
        {/* Route for login page */}
        <Route path="/" element={<LoginPage />} />

        {/* Route for login page again, if a user wants to access it from /login */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected Route for user dashboard */}
        <Route 
          path="/dashboard/*" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* Protected Route for Admin Dashboard */}
        <Route 
          path="/admin-dashboard" 
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Additional Routes for CreateInvoice, ViewInvoices, and UpdateRates */}
        <Route 
          path="/create-invoice" 
          element={
            <ProtectedRoute>
              <CreateInvoice />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/view-invoices" 
          element={
            <ProtectedRoute>
              <ViewInvoices />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/update-rates" 
          element={
            <ProtectedRoute>
              <UpdateRates />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </Router>
  );
};

export default App;
