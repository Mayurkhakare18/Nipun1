import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { User, Building2, GraduationCap, MapPin, Briefcase, X, Check, Award } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const ProfileWizardModal: React.FC = () => {
  const { isProfileModalOpen, setIsProfileModalOpen, currentUser, refreshUserData, showNotification } = useAuth();

  const [formData, setFormData] = useState({
    designation: currentUser?.designation || '',
    targetRole: currentUser?.targetRole || '',
    ministry: currentUser?.ministry || '',
    department: currentUser?.department || '',
    education: currentUser?.education || '',
    specialization: currentUser?.specialization || '',
    yearsOfExperience: currentUser?.yearsOfExperience || 5,
  });

  const [isSaving, setIsSaving] = useState(false);

  if (!isProfileModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      const res = await api.updateProfile(formData);
      if (res.success) {
        await refreshUserData();
        setIsProfileModalOpen(false);
        showNotification('Profile Updated', 'Your role targets and competency roadmap have been updated.', 'success');
      }
    } catch (err) {
      console.error('Failed to update profile:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#000a1e]/70 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-3xl shadow-2xl border border-[#c4c6cf]/40 w-full max-w-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="bg-[#f0f3ff] p-6 border-b border-[#c4c6cf]/40 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-[#002147] text-[#fe9832] shadow-2xs">
                <User className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-['Public_Sans',sans-serif] font-bold text-lg text-[#000a1e]">
                  Career Profile &amp; Target Role Configuration
                </h3>
                <p className="text-xs text-[#44474e]">
                  Configure your statistical cadre records and target aspiration
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsProfileModalOpen(false)}
              className="p-1.5 rounded-xl text-[#74777f] hover:text-[#000a1e] hover:bg-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-[#111c2d]">Current Designation</label>
                <input
                  type="text"
                  value={formData.designation}
                  onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                  className="w-full mt-1.5 px-3.5 py-2.5 bg-[#f0f3ff] border border-[#c4c6cf]/40 rounded-xl text-xs focus:outline-none focus:border-[#002147]"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#111c2d]">Target Role / Next Cadre Level</label>
                <input
                  type="text"
                  value={formData.targetRole}
                  onChange={(e) => setFormData({ ...formData, targetRole: e.target.value })}
                  className="w-full mt-1.5 px-3.5 py-2.5 bg-[#f0f3ff] border border-[#c4c6cf]/40 rounded-xl text-xs focus:outline-none focus:border-[#002147]"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#111c2d]">Ministry / Cadre</label>
              <input
                type="text"
                value={formData.ministry}
                onChange={(e) => setFormData({ ...formData, ministry: e.target.value })}
                className="w-full mt-1.5 px-3.5 py-2.5 bg-[#f0f3ff] border border-[#c4c6cf]/40 rounded-xl text-xs focus:outline-none focus:border-[#002147]"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#111c2d]">Division / Field Office</label>
              <input
                type="text"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full mt-1.5 px-3.5 py-2.5 bg-[#f0f3ff] border border-[#c4c6cf]/40 rounded-xl text-xs focus:outline-none focus:border-[#002147]"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-[#111c2d]">Education & Degree</label>
                <input
                  type="text"
                  value={formData.education}
                  onChange={(e) => setFormData({ ...formData, education: e.target.value })}
                  className="w-full mt-1.5 px-3.5 py-2.5 bg-[#f0f3ff] border border-[#c4c6cf]/40 rounded-xl text-xs focus:outline-none focus:border-[#002147]"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-[#111c2d]">Years of Official Experience</label>
                <input
                  type="number"
                  value={formData.yearsOfExperience}
                  onChange={(e) => setFormData({ ...formData, yearsOfExperience: Number(e.target.value) })}
                  className="w-full mt-1.5 px-3.5 py-2.5 bg-[#f0f3ff] border border-[#c4c6cf]/40 rounded-xl text-xs focus:outline-none focus:border-[#002147]"
                />
              </div>
            </div>

            {/* Footer Actions */}
            <div className="pt-4 border-t border-[#c4c6cf]/30 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setIsProfileModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-[#74777f] hover:text-[#111c2d]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2.5 bg-[#000a1e] hover:bg-[#002147] text-white text-xs font-bold rounded-xl transition-all shadow-xs"
              >
                {isSaving ? 'Saving Updates...' : 'Save Profile Changes'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
