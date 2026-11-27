import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  FileText,
  CreditCard,
  UserCog,
  LogOut,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
  { label: 'Contacts', to: '/contacts', icon: Users },
  { label: 'Invoices', to: '/invoices', icon: FileText },
  { label: 'Payments', to: '/payments', icon: CreditCard },
  { label: 'Users', to: '/users', icon: UserCog },
];

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/30 z-30 lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 left-0 z-40 h-screen w-[240px] bg-white border-r border-[#E5E7EB] flex flex-col justify-between transition-transform duration-200 lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Logo Header */}
          <div className="h-16 px-6 flex items-center justify-between border-b border-[#E5E7EB]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-[8px] bg-[#897DF9] flex items-center justify-center text-white">
                <FileText size={18} />
              </div>
              <span className="text-[16px] font-semibold text-[#171717]">
                InvoiceManager
              </span>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden text-[#6B7280] hover:text-[#171717]"
              aria-label="Close sidebar"
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            {navItems.map(({ label, to, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-[8px] text-[14px] font-medium transition-colors ${
                    isActive
                      ? 'bg-[#EDECFC] text-[#897DF9]'
                      : 'text-[#171717] hover:bg-[#F5F5F7]'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      size={18}
                      className={isActive ? 'text-[#897DF9]' : 'text-[#6B7280]'}
                    />
                    <span>{label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Business Info, User Footer & Logout */}
        <div className="p-4 border-t border-[#E5E7EB]">
          {user && (
            <div className="px-3 py-2.5 mb-2 rounded-[8px] bg-[#F5F5F7] border border-[#E5E7EB]">
              <p className="text-[13px] font-semibold text-[#171717] truncate">
                {user.businessName || 'My Business'}
              </p>
              <p className="text-[11px] font-medium text-[#897DF9] mt-0.5">
                ID: {user.businessIdentifier || 'BIZ-8492'}
              </p>
              <p className="text-[12px] text-[#6B7280] truncate mt-1.5 pt-1.5 border-t border-[#E5E7EB]">
                {user.username} · {user.role}
              </p>
            </div>
          )}
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[8px] text-[14px] font-medium text-[#6B7280] hover:text-[#E57373] hover:bg-[#E57373]/10 transition-colors cursor-pointer"
          >
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}