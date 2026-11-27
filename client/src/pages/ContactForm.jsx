import { useState } from 'react';
import { ChevronLeft, Trash2 } from 'lucide-react';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ContactForm({ initialContact, onSave, onCancel, onArchive }) {
  const isEditing = Boolean(initialContact);

  const [values, setValues] = useState({
    type: initialContact?.type ?? 'client',
    name: initialContact?.name ?? '',
    email: initialContact?.email ?? '',
    phone: initialContact?.phone ?? '',
    nif: initialContact?.nif ?? '',
    address: initialContact?.address ?? '',
    city: initialContact?.city ?? '',
    postalCode: initialContact?.postalCode ?? '',
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const validate = (data) => {
    const nextErrors = {};
    if (!data.name.trim()) {
      nextErrors.name = 'Le nom est obligatoire.';
    }
    if (!data.email.trim()) {
      nextErrors.email = "L'adresse e-mail est obligatoire.";
    } else if (!EMAIL_REGEX.test(data.email.trim())) {
      nextErrors.email = "Le format de l'e-mail est invalide.";
    }
    return nextErrors;
  };

  const handleChange = (field, value) => {
    const updated = { ...values, [field]: value };
    setValues(updated);
    if (touched[field]) {
      setErrors(validate(updated));
    }
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors(validate(values));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setTouched({ name: true, email: true });
    const validationErrors = validate(values);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) return;

    onSave(
      {
        ...values,
        name: values.name.trim(),
        email: values.email.trim(),
        phone: values.phone.trim(),
        nif: values.nif?.trim() || '',
        address: values.address?.trim() || '',
        city: values.city.trim(),
        postalCode: values.postalCode?.trim() || '',
      },
      initialContact?.id
    );
  };

  const setType = (type) => handleChange('type', type);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[14px] font-semibold text-[#1A1D26]">
          Bonjour, Sara
        </p>
        <p className="text-[12px] text-[#8C93A4]">Ma société SARL · Alger</p>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onCancel}
          aria-label="Retour à la liste des contacts"
          className="w-8 h-8 rounded-lg bg-white border border-[#ECEEF2] flex items-center justify-center text-[#4B5563] hover:bg-[#F5F6FA] transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <h1 className="text-[22px] font-bold tracking-tight text-[#1A1D26]">
          {isEditing ? 'Modifier le contact' : 'Nouveau contact'}
        </h1>
      </div>

      <form
        onSubmit={handleSubmit}
        noValidate
        className="max-w-[740px] bg-white rounded-2xl border border-[#ECEEF2] shadow-[0_1px_3px_rgba(16,24,40,0.03)] p-6 sm:p-7 space-y-5"
      >
        <div>
          <label className="block text-[12.5px] font-semibold text-[#2E3440] mb-2">
            Type de contact
          </label>
          <div className="grid grid-cols-2 gap-3">
            {['client', 'fournisseur'].map((option) => {
              const selected = values.type === option;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => setType(option)}
                  className={`py-2.5 px-4 rounded-xl text-[13px] font-medium border transition-all ${
                    selected
                      ? 'bg-[#EFEBFF] border-[#9B8AFB] text-[#5B4FE6]'
                      : 'bg-white border-[#ECEEF2] text-[#374151] hover:border-[#D5D8E2]'
                  }`}
                >
                  {option === 'client' ? 'Client' : 'Fournisseur'}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="contact-name"
              className="block text-[12.5px] font-semibold text-[#2E3440] mb-1.5"
            >
              Nom / Raison sociale <span className="text-[#DC2626]">*</span>
            </label>
            <input
              id="contact-name"
              type="text"
              value={values.name}
              onChange={(e) => handleChange('name', e.target.value)}
              onBlur={() => handleBlur('name')}
              placeholder="Ex : Boulangerie El Amel"
              className={`w-full px-3.5 py-2.5 rounded-xl text-[13px] text-[#1A1D26] placeholder:text-[#A0A7B8] border focus:outline-none focus:ring-2 transition-colors ${
                errors.name
                  ? 'border-[#E08A8A] focus:border-[#DC2626] focus:ring-[#DC2626]/10'
                  : 'border-[#ECEEF2] focus:border-[#8B7EF8] focus:ring-[#8B7EF8]/15'
              }`}
            />
            {errors.name && (
              <p className="mt-1.5 text-[11.5px] text-[#C94A4A]">
                {errors.name}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="contact-email"
              className="block text-[12.5px] font-semibold text-[#2E3440] mb-1.5"
            >
              E-mail <span className="text-[#DC2626]">*</span>
            </label>
            <input
              id="contact-email"
              type="email"
              value={values.email}
              onChange={(e) => handleChange('email', e.target.value)}
              onBlur={() => handleBlur('email')}
              placeholder="contact@exemple.dz"
              className={`w-full px-3.5 py-2.5 rounded-xl text-[13px] text-[#1A1D26] placeholder:text-[#A0A7B8] border focus:outline-none focus:ring-2 transition-colors ${
                errors.email
                  ? 'border-[#E08A8A] focus:border-[#DC2626] focus:ring-[#DC2626]/10'
                  : 'border-[#ECEEF2] focus:border-[#8B7EF8] focus:ring-[#8B7EF8]/15'
              }`}
            />
            {errors.email ? (
              <p className="mt-1.5 text-[11.5px] text-[#C94A4A]">
                {errors.email}
              </p>
            ) : (
              <p className="mt-1.5 text-[11.5px] text-[#8C93A4]">
                Les factures et rappels seront envoyés à cette adresse.
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="contact-phone"
              className="block text-[12.5px] font-semibold text-[#2E3440] mb-1.5"
            >
              Téléphone
            </label>
            <input
              id="contact-phone"
              type="tel"
              value={values.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              placeholder="0555 00 00 00"
              className="w-full px-3.5 py-2.5 rounded-xl text-[13px] text-[#1A1D26] placeholder:text-[#6B7280] border border-[#ECEEF2] focus:outline-none focus:border-[#8B7EF8] focus:ring-2 focus:ring-[#8B7EF8]/15"
            />
          </div>

          <div>
            <label
              htmlFor="contact-nif"
              className="block text-[12.5px] font-semibold text-[#2E3440] mb-1.5"
            >
              NIF / Registre de commerce
            </label>
            <input
              id="contact-nif"
              type="text"
              value={values.nif ?? ''}
              onChange={(e) => handleChange('nif', e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl text-[13px] text-[#1A1D26] border border-[#ECEEF2] focus:outline-none focus:border-[#8B7EF8] focus:ring-2 focus:ring-[#8B7EF8]/15"
            />
            <p className="mt-1.5 text-[11.5px] text-[#8C93A4]">Facultatif</p>
          </div>
        </div>

        <div>
          <label
            htmlFor="contact-address"
            className="block text-[12.5px] font-semibold text-[#2E3440] mb-1.5"
          >
            Adresse
          </label>
          <input
            id="contact-address"
            type="text"
            value={values.address ?? ''}
            onChange={(e) => handleChange('address', e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl text-[13px] text-[#1A1D26] border border-[#ECEEF2] focus:outline-none focus:border-[#8B7EF8] focus:ring-2 focus:ring-[#8B7EF8]/15"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="contact-city"
              className="block text-[12.5px] font-semibold text-[#2E3440] mb-1.5"
            >
              Ville
            </label>
            <input
              id="contact-city"
              type="text"
              value={values.city}
              onChange={(e) => handleChange('city', e.target.value)}
              placeholder="Alger"
              className="w-full px-3.5 py-2.5 rounded-xl text-[13px] text-[#1A1D26] placeholder:text-[#A0A7B8] border border-[#ECEEF2] focus:outline-none focus:border-[#8B7EF8] focus:ring-2 focus:ring-[#8B7EF8]/15"
            />
          </div>

          <div>
            <label
              htmlFor="contact-postal"
              className="block text-[12.5px] font-semibold text-[#2E3440] mb-1.5"
            >
              Code postal
            </label>
            <input
              id="contact-postal"
              type="text"
              value={values.postalCode ?? ''}
              onChange={(e) => handleChange('postalCode', e.target.value)}
              placeholder="16000"
              className="w-full px-3.5 py-2.5 rounded-xl text-[13px] text-[#1A1D26] placeholder:text-[#A0A7B8] border border-[#ECEEF2] focus:outline-none focus:border-[#8B7EF8] focus:ring-2 focus:ring-[#8B7EF8]/15"
            />
          </div>
        </div>

        <div className="pt-5 mt-2 border-t border-[#F0F1F5] flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            {isEditing && initialContact && onArchive ? (
              <button
                type="button"
                onClick={() => onArchive(initialContact.id)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[#F0DADA] text-[#B85050] text-[13px] font-medium hover:bg-[#FDF2F2] transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Archiver ce contact</span>
              </button>
            ) : (
              <button
                type="button"
                disabled
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[#F0E2E2] text-[#C48282] text-[13px] font-medium opacity-60 cursor-not-allowed"
              >
                <Trash2 className="w-4 h-4" />
                <span>Archiver ce contact</span>
              </button>
            )}
          </div>

          <div className="flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 rounded-xl border border-[#E6E8EE] bg-white text-[13px] font-medium text-[#374151] hover:bg-[#F7F8FA] transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#7B6EF6] to-[#9889FB] text-white text-[13px] font-medium shadow-[0_4px_12px_rgba(123,110,246,0.28)] hover:opacity-95 transition-opacity"
            >
              Enregistrer
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
