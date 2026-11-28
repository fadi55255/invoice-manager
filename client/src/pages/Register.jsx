/**
 * Register.jsx — Public registration page supporting creating a new business
 * (assigning Admin role) or requesting to join an existing business via its identifier.
 */
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FileText,
  User,
  Mail,
  Lock,
  Building2,
  KeyRound,
  AlertCircle,
  Clock,
  ArrowLeft,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  // 'create' = Create a new business (becomes Admin)
  // 'join'   = Join an existing business via Business Identifier (pending approval)
  const [mode, setMode] = useState('create');
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    businessName: '',
    businessIdentifier: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingRequest, setPendingRequest] = useState(null);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleModeSwitch = (newMode) => {
    setMode(newMode);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.username.trim() || !formData.email.trim() || !formData.password) {
      setError("Veuillez renseigner votre nom d'utilisateur, votre adresse e-mail et votre mot de passe.");
      return;
    }
    if (formData.password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    if (mode === 'create' && !formData.businessName.trim()) {
      setError('Veuillez saisir le nom de votre nouvelle entreprise.');
      return;
    }
    if (mode === 'join' && !formData.businessIdentifier.trim()) {
      setError("Veuillez saisir l'identifiant d'entreprise fourni par votre administrateur.");
      return;
    }

    try {
      setLoading(true);
      const result = await register({ ...formData, mode });
      if (result.status === 'pending') {
        setPendingRequest(result);
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message || "Échec de l'inscription.");
    } finally {
      setLoading(false);
    }
  };

  // Pending Admin Approval Screen (after joining an existing business)
  if (pendingRequest) {
    return (
      <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center p-4">
        <div className="w-full max-w-[440px] bg-white border border-[#E5E7EB] rounded-[12px] p-8 shadow-[0_1px_3px_rgba(0,0,0,0.05)] text-center">
          <div className="w-12 h-12 rounded-[12px] bg-[#F28B65]/15 text-[#F28B65] flex items-center justify-center mx-auto mb-4">
            <Clock size={24} />
          </div>
          <h1 className="text-[22px] font-semibold text-[#171717]">
            Demande d&apos;adhésion envoyée
          </h1>
          <p className="text-[14px] text-[#6B7280] mt-2 leading-relaxed">
            Votre demande pour rejoindre l&apos;entreprise{' '}
            <span className="font-semibold text-[#171717]">
              {pendingRequest.businessIdentifier}
            </span>{' '}
            a été envoyée. Vous aurez accès dès qu&apos;un administrateur aura approuvé votre demande et
            attribué votre rôle.
          </p>

          <div className="mt-6 p-3.5 rounded-[8px] bg-[#F5F5F7] border border-[#E5E7EB] text-left text-[13px] space-y-1">
            <div className="flex justify-between">
              <span className="text-[#6B7280]">Nom d&apos;utilisateur :</span>
              <span className="font-medium text-[#171717]">{pendingRequest.username}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6B7280]">E-mail :</span>
              <span className="font-medium text-[#171717]">{pendingRequest.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6B7280]">Statut :</span>
              <span className="font-medium text-[#F28B65]">En attente d&apos;approbation</span>
            </div>
          </div>

          <div className="mt-6 space-y-2.5">
            <Link
              to="/login"
              className="w-full h-[40px] bg-[#897DF9] hover:bg-[#7769E8] text-white text-[14px] font-medium rounded-[8px] flex items-center justify-center transition-colors"
            >
              Retour à la connexion
            </Link>
            <button
              type="button"
              onClick={() => setPendingRequest(null)}
              className="w-full h-[38px] text-[13px] font-medium text-[#6B7280] hover:text-[#171717] inline-flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft size={14} />
              <span>Retour à l&apos;inscription</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center p-4">
      <div className="w-full max-w-[460px] bg-white border border-[#E5E7EB] rounded-[12px] p-8 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-11 h-11 rounded-[10px] bg-[#EDECFC] flex items-center justify-center text-[#897DF9] mb-3">
            <FileText size={22} />
          </div>
          <h1 className="text-[24px] font-semibold text-[#171717]">Créer un compte</h1>
          <p className="text-[14px] text-[#6B7280] mt-1">
            Configurez une nouvelle entreprise ou rejoignez un espace existant
          </p>
        </div>

        {/* Mode Toggle: Create vs Join Business */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#F5F5F7] border border-[#E5E7EB] rounded-[8px] mb-5">
          <button
            type="button"
            onClick={() => handleModeSwitch('create')}
            className={`h-[36px] rounded-[6px] text-[13px] font-medium transition-colors cursor-pointer ${
              mode === 'create'
                ? 'bg-white text-[#897DF9] shadow-[0_1px_2px_rgba(0,0,0,0.05)]'
                : 'text-[#6B7280] hover:text-[#171717]'
            }`}
          >
            Créer une entreprise
          </button>
          <button
            type="button"
            onClick={() => handleModeSwitch('join')}
            className={`h-[36px] rounded-[6px] text-[13px] font-medium transition-colors cursor-pointer ${
              mode === 'join'
                ? 'bg-white text-[#897DF9] shadow-[0_1px_2px_rgba(0,0,0,0.05)]'
                : 'text-[#6B7280] hover:text-[#171717]'
            }`}
          >
            Rejoindre une entreprise
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-[8px] bg-[#E57373]/10 border border-[#E57373] flex items-center gap-2 text-[13px] text-[#E57373]">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username */}
          <div>
            <label className="block text-[13px] font-medium text-[#171717] mb-1.5">
              Nom d&apos;utilisateur
            </label>
            <div className="relative">
              <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280]" />
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="alex_morgan"
                className="w-full h-[40px] pl-9 pr-3 bg-white border border-[#E5E7EB] rounded-[8px] text-[14px] text-[#171717] placeholder-[#9CA3AF] focus:outline-none focus:border-[#897DF9]"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-[13px] font-medium text-[#171717] mb-1.5">
              Adresse e-mail
            </label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280]" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="alex@entreprise.com"
                className="w-full h-[40px] pl-9 pr-3 bg-white border border-[#E5E7EB] rounded-[8px] text-[14px] text-[#171717] placeholder-[#9CA3AF] focus:outline-none focus:border-[#897DF9]"
              />
            </div>
          </div>

          {/* Conditional Business Field */}
          {mode === 'create' ? (
            <div>
              <label className="block text-[13px] font-medium text-[#171717] mb-1.5">
                Nom de l&apos;entreprise
              </label>
              <div className="relative">
                <Building2
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280]"
                />
                <input
                  type="text"
                  name="businessName"
                  value={formData.businessName}
                  onChange={handleChange}
                  placeholder="Ma Société SARL"
                  className="w-full h-[40px] pl-9 pr-3 bg-white border border-[#E5E7EB] rounded-[8px] text-[14px] text-[#171717] placeholder-[#9CA3AF] focus:outline-none focus:border-[#897DF9]"
                />
              </div>
              <p className="text-[12px] text-[#6B7280] mt-1">
                Vous deviendrez automatiquement le premier administrateur de cette entreprise.
              </p>
            </div>
          ) : (
            <div>
              <label className="block text-[13px] font-medium text-[#171717] mb-1.5">
                Identifiant d&apos;entreprise
              </label>
              <div className="relative">
                <KeyRound
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280]"
                />
                <input
                  type="text"
                  name="businessIdentifier"
                  value={formData.businessIdentifier}
                  onChange={handleChange}
                  placeholder="ex. BIZ-8492"
                  className="w-full h-[40px] pl-9 pr-3 bg-white border border-[#E5E7EB] rounded-[8px] text-[14px] text-[#171717] placeholder-[#9CA3AF] uppercase focus:outline-none focus:border-[#897DF9]"
                />
              </div>
              <p className="text-[12px] text-[#6B7280] mt-1">
                Demandez cet identifiant unique à l&apos;administrateur de votre entreprise. L&apos;accès nécessite son approbation.
              </p>
            </div>
          )}

          {/* Password */}
          <div>
            <label className="block text-[13px] font-medium text-[#171717] mb-1.5">
              Mot de passe
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280]" />
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Au moins 6 caractères"
                className="w-full h-[40px] pl-9 pr-3 bg-white border border-[#E5E7EB] rounded-[8px] text-[14px] text-[#171717] placeholder-[#9CA3AF] focus:outline-none focus:border-[#897DF9]"
              />
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-[13px] font-medium text-[#171717] mb-1.5">
              Confirmer le mot de passe
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280]" />
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Répétez le mot de passe"
                className="w-full h-[40px] pl-9 pr-3 bg-white border border-[#E5E7EB] rounded-[8px] text-[14px] text-[#171717] placeholder-[#9CA3AF] focus:outline-none focus:border-[#897DF9]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-[40px] mt-2 bg-[#897DF9] hover:bg-[#7769E8] disabled:opacity-60 text-white text-[14px] font-medium rounded-[8px] transition-colors cursor-pointer"
          >
            {loading
              ? 'Envoi en cours...'
              : mode === 'create'
              ? "Créer l'entreprise et le compte"
              : "Demander à rejoindre l'entreprise"}
          </button>
        </form>

        <p className="text-center text-[13px] text-[#6B7280] mt-6">
          Vous avez déjà un compte ?{' '}
          <Link to="/login" className="text-[#897DF9] hover:text-[#7769E8] font-medium">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}