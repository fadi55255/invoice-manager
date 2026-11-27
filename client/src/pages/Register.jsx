import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FileText, User, Mail, Lock, Shield, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'Admin',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim() || !formData.email.trim() || !formData.password) {
      setError('Please fill in all required fields.');
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

    try {
      setLoading(true);
      await register(formData);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center p-4">
      <div className="w-full max-w-[440px] bg-white border border-[#E5E7EB] rounded-[12px] p-8 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-11 h-11 rounded-[10px] bg-[#EDECFC] flex items-center justify-center text-[#897DF9] mb-3">
            <FileText size={22} />
          </div>
          <h1 className="text-[24px] font-semibold text-[#171717]">Create an account</h1>
          <p className="text-[14px] text-[#6B7280] mt-1">
            Set up your workspace in Invoice Manager
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-[8px] bg-[#E57373]/10 border border-[#E57373] flex items-center gap-2 text-[13px] text-[#E57373]">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-[13px] font-medium text-[#171717] mb-1.5">
              Full Name
            </label>
            <div className="relative">
              <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280]" />
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Alex Morgan"
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

          {/* Role Selection (matches project roles) */}
          <div>
            <label className="block text-[13px] font-medium text-[#171717] mb-1.5">
              Role
            </label>
            <div className="relative">
              <Shield size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280]" />
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full h-[40px] pl-9 pr-3 bg-white border border-[#E5E7EB] rounded-[8px] text-[14px] text-[#171717] focus:outline-none focus:border-[#897DF9]"
              >
                <option value="Admin">Admin (Business Owner)</option>
                <option value="Accountant">Accountant / Clerk</option>
                <option value="Viewer">Viewer (Manager / Auditor)</option>
              </select>
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
            {loading ? 'Creating account...' : 'Create Account'}
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