import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FileText, Mail, Lock, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Please enter both your email and password.');
      return;
    }

    try {
      setLoading(true);
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Failed to sign in.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center p-4">
      <div className="w-full max-w-[420px] bg-white border border-[#E5E7EB] rounded-[12px] p-8 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-11 h-11 rounded-[10px] bg-[#EDECFC] flex items-center justify-center text-[#897DF9] mb-3">
            <FileText size={22} />
          </div>
          <h1 className="text-[24px] font-semibold text-[#171717]">Welcome back</h1>
          <p className="text-[14px] text-[#6B7280] mt-1">
            Sign in to your Invoice Manager account
          </p>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mb-4 p-3 rounded-[8px] bg-[#E57373]/10 border border-[#E57373] flex items-center gap-2 text-[13px] text-[#E57373]">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-[13px] font-medium text-[#171717] mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280]" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full h-[40px] pl-9 pr-3 bg-white border border-[#E5E7EB] rounded-[8px] text-[14px] text-[#171717] placeholder-[#9CA3AF] focus:outline-none focus:border-[#897DF9]"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-[13px] font-medium text-[#171717] mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280]" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-[40px] pl-9 pr-3 bg-white border border-[#E5E7EB] rounded-[8px] text-[14px] text-[#171717] placeholder-[#9CA3AF] focus:outline-none focus:border-[#897DF9]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-[40px] mt-2 bg-[#897DF9] hover:bg-[#7769E8] disabled:opacity-60 text-white text-[14px] font-medium rounded-[8px] transition-colors cursor-pointer"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-[13px] text-[#6B7280] mt-6">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="text-[#897DF9] hover:text-[#7769E8] font-medium">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}