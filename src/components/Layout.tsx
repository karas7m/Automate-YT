import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { User, LogOut, LayoutDashboard, PlusCircle, Video, Settings, Youtube, Menu, X, Sparkles, MessageCircle, Send, Loader2 } from "lucide-react";
import { auth } from "../lib/firebase";
import { motion, AnimatePresence } from "motion/react";
import { ai, MODELS } from "../lib/gemini";

export default function Layout({ children, user }: { children: React.ReactNode; user: any }) {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isHelperOpen, setIsHelperOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<{ role: "user" | "nova", text: string }[]>([
    { role: "nova", text: "I'm Nova, your AI Channel Growth partner. How can I help you scale today?" }
  ]);
  const [isTyping, setIsTyping] = useState(false);

  const navItems = [
    { name: "Overview", path: "/", icon: LayoutDashboard },
    { name: "Create Video", path: "/create", icon: PlusCircle },
    { name: "My Projects", path: "/projects", icon: Video },
    { name: "Channel Info", path: "/channel", icon: Youtube },
  ];

  const handleNovaChat = async () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput;
    setMessages(prev => [...prev, { role: "user", text: userMsg }]);
    setChatInput("");
    setIsTyping(true);

    try {
      const response = await ai.models.generateContent({
        model: MODELS.FLASH,
        contents: `You are Nova, an expert AI YouTube channel strategist. Help the user with: "${userMsg}". Keep answers concise and tactical.`
      });
      
      const text = response.text || "I'm having trouble thinking right now. Please try again.";
      setMessages(prev => [...prev, { role: "nova", text }]);
    } catch (error: any) {
      console.error("Nova API Error:", error);
      const isQuota = error?.message?.includes("429") || error?.message?.includes("quota");
      const errorMsg = isQuota 
        ? "Rate limit reached. Please wait a moment or ensure your NOVA_API_KEY is correct." 
        : `ERROR: ${error.message || "Engine failure"}`;
      setMessages(prev => [...prev, { role: "nova", text: errorMsg }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#F9F9F8] overflow-hidden flex-col md:flex-row">
      {/* Mobile Header */}
      <header className="md:hidden h-16 border-b border-[#EFEFEF] bg-white flex items-center justify-between px-6 z-40">
        <div className="font-mono text-sm tracking-tighter flex items-center gap-2">
          <div className="w-5 h-5 bg-brand-primary flex items-center justify-center rounded-sm">
            <div className="w-1.5 h-1.5 bg-brand-accent" />
          </div>
          AUTO_AI
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Sidebar - Desktop */}
      <aside className={`
        fixed inset-0 z-30 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 md:inset-auto
        w-64 border-r border-[#EFEFEF] bg-white flex flex-col
        ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        <div className="p-8 border-b border-[#EFEFEF] hidden md:block">
          <div className="font-mono text-lg tracking-tighter flex items-center gap-2">
            <div className="w-6 h-6 bg-brand-primary flex items-center justify-center rounded-sm">
              <div className="w-2 h-2 bg-brand-accent animate-pulse" />
            </div>
            AUTOCHANNEL_AI
          </div>
        </div>

        <nav className="flex-1 p-4 flex flex-col gap-1 mt-16 md:mt-0">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all ${
                  isActive 
                    ? "bg-brand-primary text-white" 
                    : "text-brand-primary/60 hover:bg-[#F5F5F5] hover:text-brand-primary"
                }`}
                id={`nav-${item.name.toLowerCase().replace(" ", "-")}`}
              >
                <Icon className="w-4 h-4" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[#EFEFEF]">
          <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-[#F5F5F5] mb-4">
            <div className="w-8 h-8 flex-shrink-0 rounded-full bg-brand-accent/10 flex items-center justify-center text-brand-accent text-xs font-bold uppercase">
              {user.email?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-medium truncate">{user.email}</div>
              <div className="text-[9px] text-brand-primary/40 font-mono">PRO_PLAN</div>
            </div>
          </div>
          
          <button 
            onClick={() => auth.signOut()}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-red-500 hover:bg-red-50 transition-all font-medium"
            id="logout-btn"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 relative">
        <div className="max-w-6xl mx-auto mb-20 md:mb-0">
          {children}
        </div>
      </main>

      {/* AI Helper "Nova" Floating UI */}
      <div className="fixed bottom-6 right-6 md:bottom-8 md:right-8 z-50">
        <AnimatePresence>
          {isHelperOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-[320px] md:w-[380px] h-[480px] bg-white rounded-3xl shadow-2xl border border-[#EFEFEF] mb-4 flex flex-col overflow-hidden"
            >
              <div className="p-5 bg-brand-primary text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-brand-accent" />
                  <span className="font-mono text-xs tracking-tighter uppercase">Nova Helper v1.0</span>
                </div>
                <button onClick={() => setIsHelperOpen(false)}><X className="w-4 h-4" /></button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4 text-sm font-light">
                {messages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] p-3 rounded-2xl ${
                      m.role === 'user' 
                        ? 'bg-brand-accent text-white rounded-tr-none' 
                        : 'bg-[#F5F5F5] text-brand-primary rounded-tl-none'
                    }`}>
                      {m.text}
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-[#F5F5F5] p-3 rounded-2xl rounded-tl-none flex gap-1">
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" />
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                      <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-[#F0F0F0] flex gap-2">
                <input 
                  type="text" 
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleNovaChat()}
                  placeholder="Ask Nova about growth..."
                  className="flex-1 bg-[#F9F9F8] border-none text-xs p-3 rounded-xl focus:ring-1 focus:ring-brand-accent/20"
                />
                <button 
                  onClick={handleNovaChat}
                  className="p-3 bg-brand-primary text-white rounded-xl active:scale-95 transition-transform"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={() => setIsHelperOpen(!isHelperOpen)}
          className={`w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all ${
            isHelperOpen ? 'bg-brand-primary text-white rotate-90' : 'bg-brand-accent text-white hover:scale-110'
          }`}
          id="nova-toggle"
        >
          {isHelperOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
        </button>
      </div>
    </div>
  );
}
