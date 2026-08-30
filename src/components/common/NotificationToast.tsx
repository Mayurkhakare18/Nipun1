import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const NotificationToast: React.FC = () => {
  const { notification, showNotification } = useAuth();

  if (!notification) return null;

  const isSuccess = notification.type === 'success' || !notification.type;
  const isWarning = notification.type === 'warning';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        className="fixed bottom-6 right-6 z-50 max-w-md bg-white border border-[#c4c6cf]/40 shadow-2xl rounded-2xl p-4 flex items-start gap-3"
      >
        <div className={`p-2 rounded-xl shrink-0 ${isSuccess ? 'bg-[#002147]/10 text-[#002147]' : isWarning ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'}`}>
          {isSuccess && <CheckCircle2 className="w-5 h-5" />}
          {isWarning && <AlertCircle className="w-5 h-5" />}
          {!isSuccess && !isWarning && <Info className="w-5 h-5" />}
        </div>
        <div className="flex-1 pr-2">
          <h4 className="text-sm font-semibold text-[#111c2d]">{notification.title}</h4>
          <p className="text-xs text-[#44474e] mt-0.5 leading-relaxed">{notification.message}</p>
        </div>
        <button
          onClick={() => showNotification('', '')}
          className="text-[#74777f] hover:text-[#111c2d] p-1 transition-colors"
          title="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </motion.div>
    </AnimatePresence>
  );
};
