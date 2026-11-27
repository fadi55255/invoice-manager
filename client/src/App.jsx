import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

function PlaceholderPage({ title, subtitle }) {
  return (
    <div>
      <h1 className="text-[24px] font-semibold text-[#171717]">{title}</h1>
      <p className="text-[14px] text-[#6B7280] mt-1">{subtitle}</p>
      <div className="mt-6 bg-white border border-[#E5E7EB] rounded-[12px] p-6 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
        <p className="text-[14px] text-[#6B7280]">
          {title} module content will be rendered here.
        </p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected App Routes with Sidebar */}
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route
              path="/dashboard"
              element={
                <PlaceholderPage
                  title="Dashboard"
                  subtitle="Overview of receivables, payables, and overdue invoices"
                />
              }
            />
            <Route
              path="/contacts"
              element={
                <PlaceholderPage
                  title="Contacts"
                  subtitle="Manage your customers and suppliers"
                />
              }
            />
            <Route
              path="/invoices"
              element={
                <PlaceholderPage
                  title="Invoices"
                  subtitle="Track sales and purchase invoices"
                />
              }
            />
            <Route
              path="/payments"
              element={
                <PlaceholderPage
                  title="Payments"
                  subtitle="Record and monitor full or partial payments"
                />
              }
            />
          </Route>

          {/* Default Redirect */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}