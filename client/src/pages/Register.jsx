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
      setError('Please fill in your username, email, and password.');
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (mode === 'create' && !formData.businessName.trim()) {
      setError('Please enter a name for your new business.');
      return;
    }
    if (mode === 'join' && !formData.businessIdentifier.trim()) {
      setError('Please enter the Business Identifier provided by your Admin.');
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
      setError(err.message || 'Registration failed.');
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
            Membership Request Submitted
          </h1>
          <p className="text-[14px] text-[#6B7280] mt-2 leading-relaxed">
            Your request to join business{' '}
            <span className="font-semibold text-[#171717]">
              {pendingRequest.businessIdentifier}
            </span>{' '}
            has been sent. You will gain access once an Admin approves your request and
            assigns your role.
          </p>

          <div className="mt-6 p-3.5 rounded-[8px] bg-[#F5F5F7] border border-[#E5E7EB] text-left text-[13px] space-y-1">
            <div className="flex justify-between">
              <span className="text-[#6B7280]">Username:</span>
              <span className="font-medium text-[#171717]">{pendingRequest.username}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6B7280]">Email:</span>
              <span className="font-medium text-[#171717]">{pendingRequest.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#6B7280]">Status:</span>
              <span className="font-medium text-[#F28B65]">Pending Approval</span>
            </div>
          </div>

          <div className="mt-6 space-y-2.5">
            <Link
              to="/login"
              className="w-full h-[40px] bg-[#897DF9] hover:bg-[#7769E8] text-white text-[14px] font-medium rounded-[8px] flex items-center justify-center transition-colors"
            >
              Return to Sign In
            </Link>
            <button
              type="button"
              onClick={() => setPendingRequest(null)}
              className="w-full h-[38px] text-[13px] font-medium text-[#6B7280] hover:text-[#171717] inline-flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft size={14} />
              <span>Back to Registration</span>
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
          <h1 className="text-[24px] font-semibold text-[#171717]">Create an account</h1>
          <p className="text-[14px] text-[#6B7280] mt-1">
            Set up a new business or join an existing workspace
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
            Create New Business
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
            Join Existing Business
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
              Username
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
              Email Address
            </label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280]" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="alex@company.com"
                className="w-full h-[40px] pl-9 pr-3 bg-white border border-[#E5E7EB] rounded-[8px] text-[14px] text-[#171717] placeholder-[#9CA3AF] focus:outline-none focus:border-[#897DF9]"
              />
            </div>
          </div>

          {/* Conditional Business Field */}
          {mode === 'create' ? (
            <div>
              <label className="block text-[13px] font-medium text-[#171717] mb-1.5">
                Business Name
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
                  placeholder="Acme Studio LLC"
                  className="w-full h-[40px] pl-9 pr-3 bg-white border border-[#E5E7EB] rounded-[8px] text-[14px] text-[#171717] placeholder-[#9CA3AF] focus:outline-none focus:border-[#897DF9]"
                />
              </div>
              <p className="text-[12px] text-[#6B7280] mt-1">
                You will automatically become the first Admin of this business.
              </p>
            </div>
          ) : (
            <div>
              <label className="block text-[13px] font-medium text-[#171717] mb-1.5">
                Business Identifier
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
                  placeholder="e.g. BIZ-8492"
                  className="w-full h-[40px] pl-9 pr-3 bg-white border border-[#E5E7EB] rounded-[8px] text-[14px] text-[#171717] placeholder-[#9CA3AF] uppercase focus:outline-none focus:border-[#897DF9]"
                />
              </div>
              <p className="text-[12px] text-[#6B7280] mt-1">
                Ask your business Admin for this unique identifier. Access requires Admin approval.
              </p>
            </div>
          )}

          {/* Password */}
          <div>
            <label className="block text-[13px] font-medium text-[#171717] mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280]" />
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="At least 6 characters"
                className="w-full h-[40px] pl-9 pr-3 bg-white border border-[#E5E7EB] rounded-[8px] text-[14px] text-[#171717] placeholder-[#9CA3AF] focus:outline-none focus:border-[#897DF9]"
              />
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-[13px] font-medium text-[#171717] mb-1.5">
              Confirm Password
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280]" />
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Repeat password"
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
              ? 'Submitting...'
              : mode === 'create'
              ? 'Create Business & Account'
              : 'Request to Join Business'}
          </button>
        </form>

        <p className="text-center text-[13px] text-[#6B7280] mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-[#897DF9] hover:text-[#7769E8] font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}