import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabaseService } from '../../services/supabaseService';
import { supabase } from '../../lib/supabase';
import { NipunLogo } from '../common/NipunLogo';
import {
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  ArrowLeft,
  RotateCw,
  Check,
  X as XIcon,
} from 'lucide-react';

export const ResetPasswordPage: React.FC = () => {
  const { setActiveView, openAuthModal, showNotification } = useAuth();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [hasValidSession, setHasValidSession] = useState<boolean | null>(null);
  const [userEmail, setUserEmail] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 1. Verify active Supabase recovery session exists
  useEffect(() => {
    let isMounted = true;

    async function checkRecoverySession() {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error || !session?.user) {
          if (isMounted) setHasValidSession(false);
          return;
        }

        if (isMounted) {
          setHasValidSession(true);
          setUserEmail(session.user.email || '');
        }
      } catch (err) {
        console.warn('[ResetPassword] Session check error:', err);
        if (isMounted) setHasValidSession(false);
      }
    }

    checkRecoverySession();

    return () => {
      isMounted = false;
    };
  }, []);

  // Live password requirement checks
  const hasMinLength = newPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasLowercase = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;

  const isFormValid =
    hasMinLength &&
    hasUppercase &&
    hasLowercase &&
    hasNumber &&
    passwordsMatch;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid || isSubmitting) return;

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      await supabaseService.updatePassword(newPassword);
      setIsSuccess(true);
      showNotification(
        'Password Updated Successfully',
        'Your official credentials have been updated securely in Supabase Auth.',
        'success'
      );
    } catch (err: any) {
      console.error('[ResetPassword] Update error:', err);
      setErrorMessage(
        err?.message ||
          'Failed to update password. Your recovery session may have expired. Please request a new link.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReturnToLogin = () => {
    setActiveView('landing');
    setTimeout(() => {
      openAuthModal('signin');
    }, 150);
  };

  return (
    <div className="min-h-screen bg-[#f9f9ff] text-[#111c2d] flex flex-col font-['Inter',sans-serif]">
      {/* Government Official Strip */}
      <div className="bg-[#000a1e] text-white text-[11px] py-1.5 px-4 sm:px-8 flex items-center justify-between tracking-wide border-b border-[#fe9832]/30">
        <div className="flex items-center gap-2 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="font-semibold tracking-wider">GOVERNMENT OF INDIA</span>
          <span className="text-[#8e9099] hidden sm:inline">|</span>
          <span className="text-[#c4c6cf] hidden sm:inline">
            Ministry of Statistics and Programme Implementation (MoSPI)
          </span>
        </div>
        <div className="text-xs text-[#c4c6cf]">
          <span className="text-[11px] font-medium text-emerald-400">
            Secure Authentication Portal
          </span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-[#c4c6cf]/40 overflow-hidden animate-fade-in">
          
          {/* Card Header with Branding */}
          <div className="p-6 sm:p-8 bg-gradient-to-b from-[#f0f3ff] to-white border-b border-[#c4c6cf]/30 flex flex-col items-center text-center">
            <div className="mb-4">
              <NipunLogo variant="horizontal" size="md" />
            </div>
            <div className="w-12 h-12 rounded-2xl bg-[#000a1e] text-[#fe9832] flex items-center justify-center shadow-md mb-3">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black font-['Public_Sans',sans-serif] text-[#000a1e]">
              Reset Password
            </h1>
            <p className="text-xs text-[#44474e] mt-1 max-w-xs">
              National Statistical Capacity Building &amp; Competency Intelligence Platform
            </p>
          </div>

          {/* Card Body */}
          <div className="p-6 sm:p-8 space-y-5">
            {/* 1. Checking Session State */}
            {hasValidSession === null && (
              <div className="py-12 flex flex-col items-center justify-center gap-3 text-center">
                <div className="w-8 h-8 border-3 border-[#000a1e] border-t-[#fe9832] rounded-full animate-spin"></div>
                <span className="text-xs font-bold text-[#44474e]">
                  Verifying Supabase recovery session credentials...
                </span>
              </div>
            )}

            {/* 2. Invalid / Expired Session State */}
            {hasValidSession === false && !isSuccess && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-rose-900">
                    <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                    <span>Recovery Session Invalid or Expired</span>
                  </div>
                  <p className="leading-relaxed">
                    No active password recovery session was detected. Password recovery links can only be accessed once and expire shortly after dispatch for security.
                  </p>
                </div>

                <div className="pt-2 flex flex-col gap-2">
                  <button
                    onClick={handleReturnToLogin}
                    className="w-full py-3 bg-[#000a1e] hover:bg-[#002147] text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Return to Login &amp; Request New Link</span>
                  </button>
                </div>
              </div>
            )}

            {/* 3. Success State */}
            {isSuccess && (
              <div className="space-y-4 py-2">
                <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-2 text-center">
                  <div className="w-12 h-12 mx-auto rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mb-1">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <h3 className="font-bold text-sm text-emerald-950">Password Updated Successfully</h3>
                  <p className="leading-relaxed text-emerald-800">
                    Your official credentials have been updated securely in Supabase Auth. You can now access your MoSPI workspace with your new password.
                  </p>
                </div>

                <button
                  onClick={handleReturnToLogin}
                  className="w-full py-3 bg-[#000a1e] hover:bg-[#002147] text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4 text-[#fe9832]" />
                  <span>Proceed to Officer Sign In</span>
                </button>
              </div>
            )}

            {/* 4. Active Recovery Session: Password Reset Form */}
            {hasValidSession === true && !isSuccess && (
              <form onSubmit={handleSubmit} className="space-y-4">
                {userEmail && (
                  <div className="p-3 bg-[#f0f3ff] rounded-xl border border-[#c4c6cf]/40 text-xs flex items-center justify-between">
                    <span className="text-[#44474e] font-medium">Account:</span>
                    <span className="font-bold text-[#000a1e] font-mono">{userEmail}</span>
                  </div>
                )}

                {errorMessage && (
                  <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2.5">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* New Password */}
                <div>
                  <label className="block text-xs font-bold text-[#000a1e] mb-1.5">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#74777f] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      disabled={isSubmitting}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new strong password"
                      className="w-full pl-10 pr-10 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#000a1e] focus:bg-white text-slate-800 transition-all"
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

                {/* Confirm Password */}
                <div>
                  <label className="block text-xs font-bold text-[#000a1e] mb-1.5">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#74777f] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      required
                      disabled={isSubmitting}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      className="w-full pl-10 pr-10 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#000a1e] focus:bg-white text-slate-800 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Password Requirements Checklist */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-[11px] space-y-1.5">
                  <span className="font-bold text-slate-700 block text-[10px] uppercase tracking-wider mb-1">
                    Password Security Standards
                  </span>
                  <div className="grid grid-cols-1 gap-1">
                    <div className="flex items-center gap-2">
                      {hasMinLength ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600 font-bold" />
                      ) : (
                        <XIcon className="w-3.5 h-3.5 text-slate-400" />
                      )}
                      <span className={hasMinLength ? 'text-emerald-700 font-medium' : 'text-slate-500'}>
                        At least 8 characters in length
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {hasUppercase ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600 font-bold" />
                      ) : (
                        <XIcon className="w-3.5 h-3.5 text-slate-400" />
                      )}
                      <span className={hasUppercase ? 'text-emerald-700 font-medium' : 'text-slate-500'}>
                        At least one uppercase letter (A-Z)
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {hasLowercase ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600 font-bold" />
                      ) : (
                        <XIcon className="w-3.5 h-3.5 text-slate-400" />
                      )}
                      <span className={hasLowercase ? 'text-emerald-700 font-medium' : 'text-slate-500'}>
                        At least one lowercase letter (a-z)
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {hasNumber ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600 font-bold" />
                      ) : (
                        <XIcon className="w-3.5 h-3.5 text-slate-400" />
                      )}
                      <span className={hasNumber ? 'text-emerald-700 font-medium' : 'text-slate-500'}>
                        At least one numeric digit (0-9)
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {passwordsMatch ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600 font-bold" />
                      ) : (
                        <XIcon className="w-3.5 h-3.5 text-slate-400" />
                      )}
                      <span className={passwordsMatch ? 'text-emerald-700 font-medium' : 'text-slate-500'}>
                        Passwords match
                      </span>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={!isFormValid || isSubmitting}
                  className="w-full py-3 bg-[#000a1e] hover:bg-[#002147] text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <RotateCw className="w-4 h-4 animate-spin text-[#fe9832]" />
                      <span>Updating Password in Supabase Auth...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4 text-[#fe9832]" />
                      <span>Update Password</span>
                    </>
                  )}
                </button>

                {/* Return Action */}
                <button
                  type="button"
                  onClick={handleReturnToLogin}
                  className="w-full py-2 text-xs font-semibold text-[#74777f] hover:text-[#000a1e] transition-colors cursor-pointer"
                >
                  Cancel &amp; Return to Sign In
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
