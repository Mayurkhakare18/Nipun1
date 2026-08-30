import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  ShieldCheck,
  Lock,
  Mail,
  User,
  Building2,
  Briefcase,
  Layers,
  Sparkles,
  X,
  ArrowRight,
  CheckCircle2,
  KeyRound,
  Eye,
  EyeOff,
  Smartphone,
  RotateCw,
  AlertCircle,
  Check,
} from 'lucide-react';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    setIsAuthModalOpen,
    authModalTab,
    setAuthModalTab,
    login,
    loginWithGoogle,
    register,
    loginWithParichay,
    isLoading,
    authError,
    clearAuthError,
    showNotification,
  } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Password Login state
  const [loginEmail, setLoginEmail] = useState('ananya.sharma@mospi.gov.in');
  const [loginPassword, setLoginPassword] = useState('Learner@2026');

  // Forgot password modal state
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');

  // Register form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regDesignation, setRegDesignation] = useState('Senior Statistical Officer');
  const [regMinistry, setRegMinistry] = useState('Ministry of Statistics and Programme Implementation (MoSPI)');
  const [regDepartment, setRegDepartment] = useState('National Accounts Division (NAD)');
  const [regCadre, setRegCadre] = useState('Subordinate Statistical Service (SSS)');
  const [regRole, setRegRole] = useState<'LEARNER' | 'TRAINER' | 'ADMINISTRATOR'>('LEARNER');

  if (!isAuthModalOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail) return;
    await login({ email: loginEmail, password: loginPassword });
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim()) {
      showNotification('Validation Error', 'Please enter your full official name.', 'warning');
      return;
    }
    if (!regEmail.trim()) {
      showNotification('Validation Error', 'Please enter your official email address.', 'warning');
      return;
    }
    if (!regPassword || regPassword.length < 6) {
      showNotification('Validation Error', 'Official password must be at least 6 characters in length.', 'warning');
      return;
    }
    await register({
      name: regName.trim(),
      email: regEmail.trim(),
      password: regPassword,
      designation: regDesignation,
      ministry: regMinistry,
      department: regDepartment,
      cadre: regCadre,
      role: regRole,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div className="bg-white text-slate-800 w-full max-w-md rounded-2xl shadow-xl border border-slate-200 overflow-hidden relative my-6">
        
        {/* Top Government Official Strip */}
        <div className="bg-slate-100 text-slate-800 px-6 py-3 flex items-center justify-between text-xs border-b border-slate-200">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-600"></span>
            <span className="font-bold text-[11px] uppercase tracking-wider text-slate-800">
              GOVERNMENT OF INDIA • NIPUN MoSPI PORTAL
            </span>
          </div>
          <button
            onClick={() => setIsAuthModalOpen(false)}
            className="p-1 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Header */}
        <div className="px-6 pt-6 pb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800 shadow-2xs">
              <ShieldCheck className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="font-['Public_Sans',sans-serif] font-bold text-lg text-slate-900">
                {authModalTab === 'signin' ? 'Officer & Cadre Login' : 'Official Portal Registration'}
              </h3>
              <p className="text-xs text-slate-500">
                Ministry of Statistics &amp; Programme Implementation
              </p>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 pt-3 space-y-4">
          {showForgotPassword ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
                <p className="font-bold text-slate-900">Password Reset Assistance</p>
                <p>Enter your official government email (@gov.in / @mospi.gov.in) to receive secure password recovery instructions.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="name@mospi.gov.in"
                    className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-800 text-slate-800"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(false)}
                  className="flex-1 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-xs font-bold rounded-xl text-slate-600 cursor-pointer"
                >
                  Back to Login
                </button>
                <button
                  type="button"
                  onClick={() => {
                    showNotification('Reset Instructions Sent', `Check inbox for ${forgotEmail || 'your email'}`, 'info');
                    setShowForgotPassword(false);
                  }}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer"
                >
                  Send Reset Link
                </button>
              </div>
            </div>
          ) : authModalTab === 'signin' ? (
            <>
              {/* LOGIN FORM */}
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                {/* Email Field */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    Official Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="name@mospi.gov.in"
                      className="w-full pl-10 pr-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-800 focus:bg-white text-slate-800"
                    />
                  </div>
                </div>

                {/* Password Field with Forgot Password Link */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-800">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                      className="text-xs font-semibold text-slate-700 hover:text-amber-700 hover:underline cursor-pointer"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={loginPassword}
                      onChange={(e) => {
                        clearAuthError();
                        setLoginPassword(e.target.value);
                      }}
                      placeholder="•••••••••••••"
                      className="w-full pl-10 pr-10 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-800 focus:bg-white text-slate-800"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Auth Error Banner */}
                {authError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                    <span>{authError}</span>
                  </div>
                )}

                {/* Seeded Credentials Helper Bar */}
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-[11px] text-slate-600">
                  <div className="flex items-center justify-between font-bold text-slate-800">
                    <span>Quick Test Accounts:</span>
                    <span className="text-[10px] text-amber-700 font-mono">Database Verified</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        clearAuthError();
                        setLoginEmail('ananya.sharma@mospi.gov.in');
                        setLoginPassword('Learner@2026');
                      }}
                      className="px-2 py-1 bg-white border border-slate-200 rounded-lg hover:border-amber-600 hover:bg-amber-50/50 text-[10px] text-slate-700 cursor-pointer font-medium"
                    >
                      Learner (Ananya)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        clearAuthError();
                        setLoginEmail('rajesh.verma@mospi.gov.in');
                        setLoginPassword('Trainer@2026');
                      }}
                      className="px-2 py-1 bg-white border border-slate-200 rounded-lg hover:border-amber-600 hover:bg-amber-50/50 text-[10px] text-slate-700 cursor-pointer font-medium"
                    >
                      Trainer (Rajesh)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        clearAuthError();
                        setLoginEmail('vikram.sen@mospi.gov.in');
                        setLoginPassword('Admin@2026');
                      }}
                      className="px-2 py-1 bg-white border border-slate-200 rounded-lg hover:border-amber-600 hover:bg-amber-50/50 text-[10px] text-slate-700 cursor-pointer font-medium"
                    >
                      Admin (Vikram)
                    </button>
                  </div>
                </div>

                {/* Remember Me */}
                <div className="flex items-center justify-between text-xs text-slate-600 pt-0.5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-3.5 h-3.5 rounded text-slate-800 border-slate-300 focus:ring-slate-800"
                    />
                    <span>Remember this session</span>
                  </label>
                  <span className="text-[11px] text-slate-400">NIC SSO Secured</span>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isLoading ? (
                    <span>Authenticating with Database...</span>
                  ) : (
                    <>
                      <span>Login to Officer Workspace</span>
                      <ArrowRight className="w-4 h-4 text-amber-500" />
                    </>
                  )}
                </button>
              </form>

              {/* Registration Toggle Link */}
              <div className="text-center pt-2">
                <p className="text-xs text-slate-600">
                  Don't have an account yet?{' '}
                  <button
                    type="button"
                    onClick={() => setAuthModalTab('register')}
                    className="font-bold text-slate-900 hover:text-amber-700 underline cursor-pointer"
                  >
                    Register here
                  </button>
                </p>
              </div>

              {/* Google Sign-In & Jan-Parichay SSO */}
              <div className="pt-3 border-t border-slate-200 space-y-2.5">
                <button
                  type="button"
                  onClick={() => loginWithGoogle()}
                  disabled={isLoading}
                  className="w-full py-2.5 px-3 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 shadow-xs font-semibold text-xs rounded-xl flex items-center justify-center gap-2.5 transition-all cursor-pointer"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Sign in with Google</span>
                </button>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                    Official Single Sign-On (Jan-Parichay):
                  </span>
                  <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                    Verified
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => loginWithParichay('LEARNER')}
                    disabled={isLoading}
                    className="py-2 px-1.5 bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 text-[11px] font-bold rounded-xl transition-colors text-center cursor-pointer"
                  >
                    Statistical Officer
                  </button>
                  <button
                    type="button"
                    onClick={() => loginWithParichay('TRAINER')}
                    disabled={isLoading}
                    className="py-2 px-1.5 bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 text-[11px] font-bold rounded-xl transition-colors text-center cursor-pointer"
                  >
                    NSSTA Faculty
                  </button>
                  <button
                    type="button"
                    onClick={() => loginWithParichay('ADMINISTRATOR')}
                    disabled={isLoading}
                    className="py-2 px-1.5 bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 text-[11px] font-bold rounded-xl transition-colors text-center cursor-pointer"
                  >
                    Cadre Admin
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* REGISTER FORM */
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Full Name &amp; Title
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="e.g. Mayur Khakare"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-800 text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Official Email Address (@gov.in / @nic.in / @mospi.gov.in)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => {
                      clearAuthError();
                      setRegEmail(e.target.value);
                    }}
                    placeholder="mayur.khakare@mospi.gov.in"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-800 text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Official Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    required
                    value={regPassword}
                    onChange={(e) => {
                      clearAuthError();
                      setRegPassword(e.target.value);
                    }}
                    placeholder="Minimum 6 characters"
                    className="w-full pl-9 pr-9 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-800 text-slate-800"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Designation
                  </label>
                  <input
                    type="text"
                    value={regDesignation}
                    onChange={(e) => setRegDesignation(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Cadre / Service
                  </label>
                  <select
                    value={regCadre}
                    onChange={(e) => setRegCadre(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-slate-800"
                  >
                    <option value="Subordinate Statistical Service (SSS)">SSS (JSO / SSO)</option>
                    <option value="Indian Statistical Service (ISS)">ISS (AD / DD / Dir)</option>
                    <option value="Central Secretariat Service">CSS / Central Secretariat</option>
                    <option value="State Statistical Bureau">State DES / DES Cadre</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Ministry / Department
                </label>
                <input
                  type="text"
                  value={regMinistry}
                  onChange={(e) => setRegMinistry(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Initial Portal Role
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['LEARNER', 'TRAINER', 'ADMINISTRATOR'] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRegRole(r)}
                      className={`py-2 px-2 text-center text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                        regRole === r
                          ? 'bg-slate-800 text-white border-slate-800'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {r === 'LEARNER' ? 'Learner' : r === 'TRAINER' ? 'Trainer' : 'Admin'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Registration Error Banner */}
              {authError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{authError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                {isLoading ? (
                  <span>Registering Official Account...</span>
                ) : (
                  <>
                    <span>Complete Registration</span>
                    <CheckCircle2 className="w-4 h-4 text-amber-500" />
                  </>
                )}
              </button>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => setAuthModalTab('signin')}
                  className="text-xs font-bold text-slate-700 hover:underline cursor-pointer"
                >
                  Already registered? Sign in here
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer Note */}
        <div className="px-6 py-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
            Official Secured MoSPI Session
          </span>
          <span className="font-mono text-[10px] text-slate-400">MoSPI-eGov</span>
        </div>
      </div>
    </div>
  );
};

