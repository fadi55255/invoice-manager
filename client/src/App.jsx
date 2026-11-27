import { createContext, useContext, useEffect, useState } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useParams,
} from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import { ContactsList } from './pages/ContactsList';
import { ContactForm } from './pages/ContactForm';
import { InvoicesList } from './pages/InvoicesList';
import { api, ApiError } from './api/api';
import { INITIAL_CONTACTS, INITIAL_INVOICES } from './utils/mockData';

const WorkspaceDataContext = createContext(null);

function useWorkspaceData() {
  return useContext(WorkspaceDataContext);
}

function WorkspaceDataProvider({ children }) {
  const [dataMode, setDataMode] = useState('checking');
  const [apiNotice, setApiNotice] = useState(null);
  const [contacts, setContacts] = useState(INITIAL_CONTACTS);
  const [invoices, setInvoices] = useState(INITIAL_INVOICES);

  useEffect(() => {
    let cancelled = false;
    async function loadInitialData() {
      try {
        const [liveContacts, liveInvoices] = await Promise.all([
          api.listContacts(),
          api.listInvoices(),
        ]);
        if (!cancelled) {
          setContacts(liveContacts);
          setInvoices(liveInvoices);
          setDataMode('live');
        }
      } catch {
        if (!cancelled) {
          setDataMode('mock');
        }
      }
    }
    loadInitialData();
    return () => {
      cancelled = true;
    };
  }, []);

  const saveContact = async (values, existingId) => {
    setApiNotice(null);
    if (dataMode === 'live') {
      try {
        if (existingId) {
          const updated = await api.updateContact(existingId, values);
          setContacts((prev) =>
            prev.map((c) => (c.id === existingId ? updated : c))
          );
        } else {
          const created = await api.createContact(values);
          setContacts((prev) => [created, ...prev]);
        }
        return true;
      } catch (err) {
        setApiNotice(
          err instanceof ApiError
            ? err.message
            : 'Erreur lors de la sauvegarde du contact.'
        );
        return false;
      }
    }

    if (existingId) {
      setContacts((prev) =>
        prev.map((c) => (c.id === existingId ? { ...c, ...values } : c))
      );
    } else {
      const created = {
        ...values,
        id: `c-${Date.now()}`,
        invoiceCount: 0,
        archived: false,
      };
      setContacts((prev) => [created, ...prev]);
    }
    return true;
  };

  const toggleArchiveContact = async (id) => {
    setApiNotice(null);
    const target = contacts.find((c) => c.id === id);
    if (!target) return false;

    if (dataMode === 'live') {
      try {
        const updated = target.archived
          ? await api.restoreContact(id)
          : await api.archiveContact(id);
        setContacts((prev) => prev.map((c) => (c.id === id ? updated : c)));
        return true;
      } catch (err) {
        setApiNotice(
          err instanceof ApiError
            ? err.message
            : "Impossible de modifier le statut d'archivage."
        );
        return false;
      }
    }

    setContacts((prev) =>
      prev.map((c) => (c.id === id ? { ...c, archived: !c.archived } : c))
    );
    return true;
  };

  return (
    <WorkspaceDataContext.Provider
      value={{
        contacts,
        invoices,
        apiNotice,
        setApiNotice,
        saveContact,
        toggleArchiveContact,
      }}
    >
      {children}
    </WorkspaceDataContext.Provider>
  );
}

function ApiNoticeBanner() {
  const { apiNotice, setApiNotice } = useWorkspaceData();
  if (!apiNotice) return null;

  return (
    <div className="mb-4 px-4 py-3 rounded-xl bg-[#FDECEC] border border-[#F5C2C2] text-[#B91C1C] text-[13px] flex items-center justify-between">
      <span>{apiNotice}</span>
      <button
        type="button"
        onClick={() => setApiNotice(null)}
        className="text-xs font-semibold underline ml-4"
      >
        Fermer
      </button>
    </div>
  );
}

function ContactsListRoute() {
  const navigate = useNavigate();
  const { contacts, setApiNotice, toggleArchiveContact } = useWorkspaceData();

  return (
    <>
      <ApiNoticeBanner />
      <ContactsList
        contacts={contacts}
        onAddNew={() => {
          setApiNotice(null);
          navigate('/contacts/new');
        }}
        onEdit={(contact) => {
          setApiNotice(null);
          navigate(`/contacts/${contact.id}/edit`);
        }}
        onToggleArchive={toggleArchiveContact}
      />
    </>
  );
}

function ContactFormRoute() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { contacts, setApiNotice, saveContact, toggleArchiveContact } =
    useWorkspaceData();

  const editingContact = id ? contacts.find((c) => c.id === id) || null : null;

  const handleSave = async (values, existingId) => {
    const ok = await saveContact(values, existingId);
    if (ok) navigate('/contacts');
  };

  const handleArchive = async (contactId) => {
    const ok = await toggleArchiveContact(contactId);
    if (ok) navigate('/contacts');
  };

  return (
    <>
      <ApiNoticeBanner />
      <ContactForm
        key={id || 'new'}
        initialContact={editingContact}
        onSave={handleSave}
        onCancel={() => {
          setApiNotice(null);
          navigate('/contacts');
        }}
        onArchive={handleArchive}
      />
    </>
  );
}

function InvoicesListRoute() {
  const { invoices } = useWorkspaceData();

  return (
    <InvoicesList
      invoices={invoices}
      onCreateInvoice={() => alert('Route /invoices/new à brancher')}
      onEditInvoice={(inv) =>
        alert(`Édition du brouillon ${inv.number} à brancher`)
      }
    />
  );
}

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
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Protected App Routes with Sidebar */}
          <Route
            element={
              <ProtectedRoute>
                <WorkspaceDataProvider>
                  <Layout />
                </WorkspaceDataProvider>
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
            <Route path="/contacts" element={<ContactsListRoute />} />
            <Route path="/contacts/new" element={<ContactFormRoute />} />
            <Route path="/contacts/:id/edit" element={<ContactFormRoute />} />
            <Route path="/invoices" element={<InvoicesListRoute />} />
            <Route
              path="/payments"
              element={
                <PlaceholderPage
                  title="Payments"
                  subtitle="Record and monitor full or partial payments"
                />
              }
            />
            <Route
              path="/users"
              element={
                <PlaceholderPage
                  title="Users & Membership"
                  subtitle="Approve membership requests, manage roles, and share your Business Identifier"
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