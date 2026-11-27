import { useMemo, useState } from 'react';
import {
  Plus,
  Search,
  ChevronDown,
  Eye,
  Pencil,
  Trash2,
  RotateCcw,
  X,
} from 'lucide-react';
import { AvatarInitial, ContactTypeBadge } from '../components/Badges';

export function ContactsList({ contacts, onAddNew, onEdit, onToggleArchive }) {
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('all');
  const [previewContact, setPreviewContact] = useState(null);

  const counts = useMemo(() => {
    const active = contacts.filter((c) => !c.archived);
    return {
      all: active.length,
      client: active.filter((c) => c.type === 'client').length,
      fournisseur: active.filter((c) => c.type === 'fournisseur').length,
      archived: contacts.filter((c) => c.archived).length,
    };
  }, [contacts]);

  const cities = useMemo(() => {
    const unique = Array.from(
      new Set(contacts.map((c) => c.city).filter(Boolean))
    );
    return unique.sort((a, b) => a.localeCompare(b, 'fr'));
  }, [contacts]);

  const filteredContacts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return contacts.filter((contact) => {
      if (activeTab === 'archived') {
        if (!contact.archived) return false;
      } else {
        if (contact.archived) return false;
        if (activeTab !== 'all' && contact.type !== activeTab) return false;
      }

      if (selectedCity !== 'all' && contact.city !== selectedCity) {
        return false;
      }

      if (q) {
        const match =
          contact.name.toLowerCase().includes(q) ||
          contact.email.toLowerCase().includes(q) ||
          (contact.phone || '').toLowerCase().includes(q) ||
          (contact.city || '').toLowerCase().includes(q);
        if (!match) return false;
      }

      return true;
    });
  }, [contacts, activeTab, searchQuery, selectedCity]);

  const tabs = [
    { id: 'all', label: `Tous (${counts.all})` },
    { id: 'client', label: `Clients (${counts.client})` },
    { id: 'fournisseur', label: `Fournisseurs (${counts.fournisseur})` },
    {
      id: 'archived',
      label: counts.archived > 0 ? `Archivés (${counts.archived})` : 'Archivés',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-[14px] font-semibold text-[#1A1D26]">
            Bonjour, Sara
          </p>
          <p className="text-[12px] text-[#8C93A4]">
            Ma société SARL · Alger
          </p>
        </div>

        <button
          type="button"
          onClick={onAddNew}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#7B6EF6] to-[#9889FB] text-white text-[13px] font-medium shadow-[0_4px_12px_rgba(123,110,246,0.28)] hover:opacity-95 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          <span>Ajouter un contact</span>
        </button>
      </div>

      <h1 className="text-[22px] font-bold tracking-tight text-[#1A1D26]">
        Contacts
      </h1>

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div className="inline-flex items-center bg-[#EFF1F5] p-1 rounded-xl self-start overflow-x-auto max-w-full">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-1.5 rounded-lg text-[12.5px] font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-white text-[#1A1D26] shadow-xs'
                    : 'text-[#6B7280] hover:text-[#1A1D26]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="w-4 h-4 text-[#6B7280] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un contact"
              className="w-full sm:w-[220px] pl-9 pr-3 py-2 bg-white border border-[#E6E8EE] rounded-xl text-[13px] text-[#1A1D26] placeholder:text-[#6B7280] focus:outline-none focus:border-[#8B7EF8] focus:ring-2 focus:ring-[#8B7EF8]/15"
            />
          </div>

          <div className="relative">
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              aria-label="Filtrer par ville"
              className="appearance-none bg-white border border-[#E6E8EE] rounded-xl pl-3.5 pr-9 py-2 text-[13px] font-medium text-[#1A1D26] focus:outline-none focus:border-[#8B7EF8] focus:ring-2 focus:ring-[#8B7EF8]/15 cursor-pointer"
            >
              <option value="all">Ville : Toutes</option>
              {cities.map((city) => (
                <option key={city} value={city}>
                  Ville : {city}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-[#6B7280] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#ECEEF2] shadow-[0_1px_3px_rgba(16,24,40,0.03)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#FAFAFC] border-b border-[#F0F1F5] text-[12px] font-medium text-[#7A8194]">
                <th className="py-3.5 px-5">Nom</th>
                <th className="py-3.5 px-4">Type</th>
                <th className="py-3.5 px-4">E-mail</th>
                <th className="py-3.5 px-4">Téléphone</th>
                <th className="py-3.5 px-4">Ville</th>
                <th className="py-3.5 px-4">Factures</th>
                <th className="py-3.5 px-5 text-right">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F2F3F7] text-[13px]">
              {filteredContacts.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-12 px-5 text-center text-[#8C93A4]"
                  >
                    Aucun contact trouvé pour ces critères.
                  </td>
                </tr>
              ) : (
                filteredContacts.map((contact) => (
                  <tr
                    key={contact.id}
                    className="hover:bg-[#FAF9FF]/70 transition-colors"
                  >
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <AvatarInitial name={contact.name} />
                        <span className="font-semibold text-[#1A1D26] whitespace-nowrap">
                          {contact.name}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <ContactTypeBadge type={contact.type} />
                    </td>
                    <td className="py-4 px-4 text-[#374151] whitespace-nowrap">
                      {contact.email}
                    </td>
                    <td className="py-4 px-4 text-[#374151] whitespace-nowrap tabular-nums">
                      {contact.phone || '—'}
                    </td>
                    <td className="py-4 px-4 text-[#374151] whitespace-nowrap">
                      {contact.city || '—'}
                    </td>
                    <td className="py-4 px-4 font-medium text-[#1A1D26] tabular-nums">
                      {contact.invoiceCount ?? 0}
                    </td>
                    <td className="py-4 px-5">
                      <div className="flex items-center justify-end gap-2.5 text-[#8C93A4]">
                        <button
                          type="button"
                          onClick={() => setPreviewContact(contact)}
                          title="Voir les détails"
                          className="p-1.5 rounded-lg hover:bg-[#F3F4F8] hover:text-[#1A1D26] transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onEdit(contact)}
                          title="Modifier"
                          className="p-1.5 rounded-lg hover:bg-[#F3F4F8] hover:text-[#6B5CE7] transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onToggleArchive(contact.id)}
                          title={
                            contact.archived
                              ? 'Restaurer ce contact'
                              : 'Archiver ce contact'
                          }
                          className="p-1.5 rounded-lg hover:bg-[#FDECEC] hover:text-[#DC2626] transition-colors"
                        >
                          {contact.archived ? (
                            <RotateCcw className="w-4 h-4" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="px-5 py-3.5 bg-[#FAFAFC] border-t border-[#F0F1F5] text-[12px] text-[#8C93A4]">
          {filteredContacts.length === 0
            ? '0 contact'
            : `1–${filteredContacts.length} sur ${filteredContacts.length} contact${
                filteredContacts.length > 1 ? 's' : ''
              }`}
        </div>
      </div>

      {previewContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/35 backdrop-blur-[1px]">
          <div className="bg-white rounded-2xl border border-[#ECEEF2] shadow-xl w-full max-w-md p-6">
            <div className="flex items-start justify-between mb-5">
              <div className="flex items-center gap-3">
                <AvatarInitial name={previewContact.name} size="md" />
                <div>
                  <h2 className="text-[16px] font-bold text-[#1A1D26]">
                    {previewContact.name}
                  </h2>
                  <div className="mt-1">
                    <ContactTypeBadge type={previewContact.type} />
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewContact(null)}
                className="p-1 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <dl className="space-y-3 text-[13px] border-t border-[#F0F1F5] pt-4">
              <div className="flex justify-between gap-4">
                <dt className="text-[#8C93A4]">E-mail</dt>
                <dd className="font-medium text-[#1A1D26]">
                  {previewContact.email}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-[#8C93A4]">Téléphone</dt>
                <dd className="font-medium text-[#1A1D26]">
                  {previewContact.phone || '—'}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-[#8C93A4]">NIF / RC</dt>
                <dd className="font-medium text-[#1A1D26]">
                  {previewContact.nif || '—'}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-[#8C93A4]">Adresse</dt>
                <dd className="font-medium text-[#1A1D26] text-right">
                  {[
                    previewContact.address,
                    previewContact.city,
                    previewContact.postalCode,
                  ]
                    .filter(Boolean)
                    .join(', ') || '—'}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-[#8C93A4]">Factures associées</dt>
                <dd className="font-semibold text-[#1A1D26]">
                  {previewContact.invoiceCount ?? 0}
                </dd>
              </div>
            </dl>

            <div className="mt-6 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setPreviewContact(null)}
                className="px-4 py-2 rounded-xl border border-[#E6E8EE] text-[13px] font-medium text-[#374151] hover:bg-gray-50"
              >
                Fermer
              </button>
              <button
                type="button"
                onClick={() => {
                  const target = previewContact;
                  setPreviewContact(null);
                  onEdit(target);
                }}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#7B6EF6] to-[#9889FB] text-white text-[13px] font-medium"
              >
                Modifier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
