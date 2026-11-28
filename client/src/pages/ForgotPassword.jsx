/**
 * ForgotPassword.jsx — Public password reset request page where users submit
 * their email address to receive reset instructions.
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Mail, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !email.includes('@')) {
      setError('Veuillez saisir une adresse e-mail valide.');
      return;
    }

    // Mock email dispatch — replace with axios.post('/api/auth/forgot-password') later
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 400);
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center p-4">
      <div className="w-full max-w-[420px] bg-white border border-[#E5E7EB] rounded-[12px] p-8 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-11 h-11 rounded-[10px] bg-[#EDECFC] flex items-center justify-center text-[#897DF9] mb-3">
            <FileText size={22} />
          </div>
          <h1 className="text-[24px] font-semibold text-[#171717]">Réinitialiser votre mot de passe</h1>
          <p className="text-[14px] text-[#6B7280] mt-1">
            {submitted
              ? 'Consultez votre boîte de réception pour la suite des instructions'
              : "Saisissez l'adresse e-mail de votre compte et nous vous enverrons un lien de réinitialisation"}
          </p>
        </div>

        {submitted ? (
          <div className="space-y-5">
            <div className="p-4 rounded-[8px] bg-[#3C9F91]/10 border border-[#3C9F91]/30 flex items-start gap-3">
              <CheckCircle2 size={20} className="text-[#3C9F91] shrink-0 mt-0.5" />
              <div className="text-[13px] text-[#171717]">
                <p className="font-medium">Lien de réinitialisation envoyé</p>
                <p className="text-[#6B7280] mt-1">
                  Si un compte existe pour <span className="font-medium text-[#171717]">{email}</span>,
                  vous recevrez sous peu un e-mail de réinitialisation du mot de passe.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setSubmitted(false);
                setEmail('');
              }}
              className="w-full h-[40px] bg-white border border-[#E5E7EB] hover:bg-[#F5F5F7] text-[#171717] text-[14px] font-medium rounded-[8px] transition-colors cursor-pointer"
            >
              Essayer une autre adresse e-mail
            </button>
          </div>
        ) : (
          <>
            {error && (
              <div className="mb-4 p-3 rounded-[8px] bg-[#E57373]/10 border border-[#E57373] flex items-center gap-2 text-[13px] text-[#E57373]">
                <AlertCircle size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[13px] font-medium text-[#171717] mb-1.5">
                  Adresse e-mail
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280]" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="vous@entreprise.com"
                    className="w-full h-[40px] pl-9 pr-3 bg-white border border-[#E5E7EB] rounded-[8px] text-[14px] text-[#171717] placeholder-[#9CA3AF] focus:outline-none focus:border-[#897DF9]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-[40px] mt-2 bg-[#897DF9] hover:bg-[#7769E8] disabled:opacity-60 text-white text-[14px] font-medium rounded-[8px] transition-colors cursor-pointer"
              >
                {loading ? 'Envoi du lien...' : 'Envoyer le lien de réinitialisation'}
              </button>
            </form>
          </>
        )}

        <div className="mt-6 text-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#6B7280] hover:text-[#171717]"
          >
            <ArrowLeft size={15} />
            <span>Retour à la connexion</span>
          </Link>
        </div>
      </div>
    </div>
  );
}