import { NavLink } from 'react-router-dom';
import {
  LayoutGrid,
  Users,
  FileText,
  CreditCard,
  Settings,
  LogOut,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { label: 'Tableau de bord', to: '/dashboard', icon: LayoutGrid },
  { label: 'Contacts', to: '/contacts', icon: Users },
  { label: 'Factures', to: '/invoices', icon: FileText },
  { label: 'Paiements', to: '/payments', icon: CreditCard },
];

const HIDE_SCROLLBAR =
  '[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden';

const itemBase =
  'w-full shrink-0 flex items-center gap-4 px-4 h-12 rounded-2xl text-[14px] font-semibold transition-colors';
const itemIdle = 'text-[#4B5563] hover:bg-[#F5F4FE] hover:text-[#1A1D26]';
const itemActive =
  'bg-gradient-to-r from-[#7B6EF6] to-[#9889FB] text-white shadow-[0_6px_16px_rgba(123,110,246,0.30)]';

function SidebarLink({ label, to, icon: Icon, onClick }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) => `${itemBase} ${isActive ? itemActive : itemIdle}`}
    >
      <Icon size={20} strokeWidth={1.8} className="shrink-0" />
      <span>{label}</span>
    </NavLink>
  );
}

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();

  const displayName = user?.fullName || user?.name || user?.username || 'Sara Benali';
  const role = user?.role || 'Admin';

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div onClick={onClose} className="fixed inset-0 bg-black/30 z-30 lg:hidden" />
      )}

      {/* Desktop: as tall as the whole page and scrolls with it. Mobile: sliding drawer. */}
      <aside
        className={`fixed top-0 left-0 z-40 h-dvh w-[250px] shrink-0 overflow-y-auto bg-white border-r border-[#ECEEF2] flex flex-col transition-transform duration-200 lg:static lg:h-auto lg:self-stretch lg:overflow-visible lg:translate-x-0 ${HIDE_SCROLLBAR} ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="shrink-0 flex items-center justify-between px-6 pt-7 pb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7B6EF6] to-[#9889FB] flex items-center justify-center text-white">
              <FileText size={19} />
            </div>
            <span className="text-[16px] font-bold text-[#1A1D26] whitespace-nowrap">
              Invoice Manager
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="lg:hidden text-[#6B7280] hover:text-[#1A1D26]"
            aria-label="Fermer le menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Main navigation */}
        <nav className="shrink-0 px-[18px] space-y-1.5">
          {navItems.map((item) => (
            <SidebarLink key={item.to} {...item} onClick={onClose} />
          ))}
        </nav>

        {/* Bottom section: at the end of the sidebar */}
        <div className="mt-auto shrink-0 px-[18px] pt-6 pb-4">
          <div className="space-y-1">
            <SidebarLink label="Paramètres" to="/settings" icon={Settings} onClick={onClose} />
            <button
              type="button"
              onClick={logout}
              className={`${itemBase} ${itemIdle} cursor-pointer`}
            >
              <LogOut size={20} strokeWidth={1.8} className="shrink-0" />
              <span>Se déconnecter</span>
            </button>
          </div>

          <div className="mt-4 pt-4 border-t border-[#ECEEF2] flex items-center gap-3 px-3">
            <div className="w-10 h-10 rounded-full bg-[#EDECFC] text-[#6B5CE7] flex items-center justify-center text-[14px] font-bold shrink-0">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 leading-tight">
              <p className="text-[13.5px] font-semibold text-[#1A1D26] truncate">{displayName}</p>
              <p className="text-[12px] text-[#8C93A4] truncate">{role}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}