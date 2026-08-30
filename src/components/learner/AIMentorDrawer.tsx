import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { AIMentorMessage } from '../../types';
import {
  Sparkles,
  Send,
  Bot,
  User,
  X,
  RotateCcw,
  Play,
  Layers,
  ChevronRight,
  BookOpen,
  GraduationCap,
  Copy,
  Check,
  Volume2,
  VolumeX,
  HelpCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const AIMentorDrawer: React.FC = () => {
  const {
    isMentorDrawerOpen,
    setIsMentorDrawerOpen,
    currentUser,
    openQuiz,
    setIsLabModalOpen,
    setIsGapCheckerOpen,
    setActiveTab,
    showNotification,
  } = useAuth();

  const initialWelcomeMessage: AIMentorMessage = {
    id: 'm-1',
    sender: 'mentor',
    content: `Namaste, ${currentUser?.name || 'Officer'}. I am your NIPUN Statistical Competency Mentor. I have analyzed your profile as ${currentUser?.designation} in MoSPI.

Your role readiness is currently **${currentUser?.roleReadiness}%** with **${currentUser?.verifiedSkillsCount} verified competencies**. Your highest-leverage priority today is closing the **Python Application Gap (Level 2 → Level 3)**.

How can I assist your statistical learning journey today?`,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    suggestedActions: [
      { label: 'Why was this Python gap detected?', actionType: 'EXPLAIN_GAP' },
      { label: 'Start 10-Min Assessment', actionType: 'START_QUIZ' },
      { label: 'Launch Survey Simulation Lab', actionType: 'LAUNCH_LAB' },
    ],
  };

  const [messages, setMessages] = useState<AIMentorMessage[]>([initialWelcomeMessage]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const starterPrompts = [
    'How do I qualify for Senior Statistical Officer (SSO)?',
    'Explain NSS 78th Round Multiplier calculation formula',
    'What are the Level 3 requirements for Python in MoSPI?',
    'Explain the difference between CPI (Rural) and CPI (Urban)',
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputMessage.trim();
    if (!text || isTyping) return;

    const userMsg: AIMentorMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsTyping(true);

    try {
      const history = messages.slice(-6).map((m) => ({ sender: m.sender, content: m.content }));
      const res = await api.sendMentorMessage(text, history);
      if (res.success) {
        const botMsg: AIMentorMessage = {
          id: `bot-${Date.now()}`,
          sender: 'mentor',
          content: res.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          suggestedActions: res.suggestedActions,
        };
        setMessages((prev) => [...prev, botMsg]);
      }
    } catch (err) {
      console.error('Mentor chat error:', err);
    } finally {
      setIsTyping(false);
    }
  };

  const handleCopyMessage = (msgId: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(msgId);
    showNotification('Copied to Clipboard', 'Mentor explanation copied.', 'info');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleResetChat = () => {
    setMessages([initialWelcomeMessage]);
    showNotification('Chat Reset', 'Started a fresh mentor session.', 'info');
  };

  const handleActionClick = (action: { label: string; actionType: string; payload?: any }) => {
    if (action.actionType === 'START_QUIZ') {
      setIsMentorDrawerOpen(false);
      openQuiz('assess-py-l3');
    } else if (action.actionType === 'LAUNCH_LAB') {
      setIsMentorDrawerOpen(false);
      setIsLabModalOpen(true);
    } else if (action.actionType === 'VIEW_RECOMMENDATIONS') {
      setIsMentorDrawerOpen(false);
      setActiveTab('recommendations');
    } else if (action.actionType === 'VIEW_PASSPORT') {
      setIsMentorDrawerOpen(false);
      setActiveTab('passport');
    } else if (action.actionType === 'RUN_GAP_CHECK' || action.actionType === 'EXPLAIN_GAP') {
      handleSendMessage('Can you explain the root cause and evidence for my Python gap in detail?');
    } else {
      handleSendMessage(action.label);
    }
  };

  return (
    <AnimatePresence>
      {isMentorDrawerOpen && (
        <div 
          className="fixed inset-0 z-50 flex justify-end bg-[#000a1e]/40 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsMentorDrawerOpen(false);
            }
          }}
        >
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between border-l border-[#c4c6cf]/40 relative z-10"
          >
            {/* Top Bar */}
            <div className="bg-[#f0f3ff] p-4 border-b border-[#c4c6cf]/40 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#002147] text-[#fe9832] flex items-center justify-center shadow-2xs">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-['Public_Sans',sans-serif] font-bold text-sm text-[#000a1e]">
                    NIPUN Statistical Capacity Mentor
                  </h3>
                  <p className="text-[10px] text-[#44474e] font-semibold flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    <span>AI Assistant • MoSPI Cadre Intelligence</span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={handleResetChat}
                  className="p-1.5 rounded-xl text-[#74777f] hover:text-[#000a1e] hover:bg-white transition-colors cursor-pointer"
                  title="Reset Conversation"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsMentorDrawerOpen(false)}
                  className="p-1.5 rounded-xl text-[#74777f] hover:text-[#000a1e] hover:bg-white transition-colors cursor-pointer"
                  title="Close Drawer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Quick Prompts Bar (When chat has 1 message) */}
            {messages.length === 1 && (
              <div className="p-3 bg-[#eef3ff] border-b border-[#c4c6cf]/30 space-y-1.5">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#002147] flex items-center gap-1">
                  <HelpCircle className="w-3 h-3 text-[#fe9832]" />
                  Suggested Inquiries
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {starterPrompts.map((prompt, pIdx) => (
                    <button
                      key={pIdx}
                      onClick={() => handleSendMessage(prompt)}
                      className="text-[11px] font-medium bg-white hover:bg-[#002147] text-[#002147] hover:text-white px-2.5 py-1 rounded-lg border border-[#c4c6cf]/40 transition-all text-left cursor-pointer"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Chat Messages */}
            <div className="flex-1 p-4 space-y-4 overflow-y-auto custom-scrollbar bg-[#f9f9ff]">
              {messages.map((msg) => {
                const isUser = msg.sender === 'user';
                return (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : ''}`}
                  >
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                        isUser
                          ? 'bg-[#002147] text-white'
                          : 'bg-[#fe9832] text-[#000a1e]'
                      }`}
                    >
                      {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                    </div>

                    <div className={`space-y-2 max-w-[85%]`}>
                      <div
                        className={`p-3.5 rounded-2xl text-xs leading-relaxed group relative ${
                          isUser
                            ? 'bg-[#000a1e] text-white rounded-tr-xs shadow-xs'
                            : 'bg-white text-[#111c2d] border border-[#c4c6cf]/30 shadow-2xs rounded-tl-xs'
                        }`}
                      >
                        <div className="whitespace-pre-line font-normal space-y-1">
                          {msg.content}
                        </div>
                        
                        <div className="flex items-center justify-between mt-2.5 pt-1.5 border-t border-black/5">
                          {!isUser && (
                            <button
                              onClick={() => handleCopyMessage(msg.id, msg.content)}
                              className="text-[10px] text-[#74777f] hover:text-[#002147] flex items-center gap-1 cursor-pointer transition-colors"
                            >
                              {copiedId === msg.id ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-600" />
                                  <span className="text-emerald-600 font-bold">Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3" />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>
                          )}
                          <div
                            className={`text-[9px] ${
                              isUser ? 'text-[#8e9099] ml-auto' : 'text-[#74777f]'
                            }`}
                          >
                            {msg.timestamp}
                          </div>
                        </div>
                      </div>

                      {/* Suggested Quick Actions */}
                      {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {msg.suggestedActions.map((action, aIdx) => (
                            <button
                              key={aIdx}
                              onClick={() => handleActionClick(action)}
                              className="px-2.5 py-1 rounded-lg bg-[#f0f3ff] hover:bg-[#e7eeff] text-[#002147] text-[11px] font-semibold border border-[#c4c6cf]/30 flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                            >
                              <span>{action.label}</span>
                              <ChevronRight className="w-3 h-3 text-[#fe9832]" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {isTyping && (
                <div className="flex items-center gap-2 text-xs text-[#74777f] p-2.5 bg-white rounded-xl border border-[#c4c6cf]/30 w-fit shadow-2xs">
                  <div className="w-6 h-6 rounded-lg bg-[#fe9832]/20 text-[#fe9832] flex items-center justify-center animate-pulse">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                  <span>Formulating statistical capacity guidance...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input */}
            <div className="p-3 border-t border-[#c4c6cf]/30 bg-white shrink-0">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  placeholder="Ask about your gaps, iGOT courses, or NSSTA..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  className="flex-1 px-3.5 py-2.5 bg-[#f0f3ff] border border-[#c4c6cf]/40 rounded-xl text-xs focus:outline-none focus:border-[#002147] font-medium"
                />
                <button
                  type="submit"
                  disabled={!inputMessage.trim() || isTyping}
                  className="p-2.5 bg-[#000a1e] hover:bg-[#002147] disabled:opacity-30 text-white rounded-xl transition-all shadow-xs cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

