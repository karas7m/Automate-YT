import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from "../lib/firebase";
import { ChevronRight, Play, Sparkles, Youtube, Zap } from "lucide-react";
import { motion } from "motion/react";

export default function LandingPage() {
  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  return (
    <div className="min-h-screen bg-brand-primary text-white overflow-x-hidden selection:bg-brand-accent selection:text-white">
      {/* Editorial Navigation */}
      <nav className="p-6 md:p-10 flex justify-between items-center max-w-screen-2xl mx-auto">
        <div className="font-mono text-xl tracking-tighter flex items-center gap-3">
          <div className="w-8 h-8 bg-brand-accent flex items-center justify-center rounded-sm rotate-12 transition-transform hover:rotate-0">
            <Play className="w-4 h-4 text-white fill-current" />
          </div>
          AUTO_AI
        </div>
        <div className="hidden md:flex gap-10 text-[11px] font-mono tracking-widest text-white/40">
           <a href="#" className="hover:text-white transition-colors">EXPERIENCE</a>
           <a href="#" className="hover:text-white transition-colors">TECHNOLOGY</a>
           <a href="#" className="hover:text-white transition-colors">PRICING</a>
        </div>
        <button 
          onClick={handleLogin}
          className="px-6 py-2.5 bg-white text-brand-primary rounded-full hover:bg-brand-accent hover:text-white transition-all text-xs font-bold tracking-widest uppercase"
          id="login-btn-top"
        >
          Access Beta
        </button>
      </nav>

      <main className="max-w-screen-2xl mx-auto px-6 md:px-10 pt-10 md:pt-20 lg:pt-32 pb-20">
        <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-mono tracking-widest text-brand-accent mb-10 uppercase">
              <Sparkles className="w-3 h-3 animate-pulse" />
              Autonomous Content Engine
            </div>
            
            <h1 className="text-[14vw] lg:text-[10vw] font-bold leading-[0.8] tracking-tighter mb-12">
              VIRAL <span className="text-white/20">CHANNELS</span> <br />
              <span className="text-brand-accent italic font-light">HANDS_FREE</span>
            </h1>
            
            <p className="text-lg md:text-xl text-white/50 max-w-xl mb-12 leading-relaxed font-light">
              We've automated the entire YouTube creative loop. Scripting, stock orchestration, voiceover, and publishing. Managed by Gemini Pro Vision.
            </p>

            <div className="flex flex-col sm:flex-row gap-6">
              <button 
                onClick={handleLogin}
                className="group relative px-10 py-5 bg-brand-accent text-white rounded-2xl font-bold text-lg overflow-hidden transition-all hover:scale-[1.02]"
                id="get-started-btn"
              >
                <span className="relative z-10 flex items-center gap-3">
                  Start Production
                  <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </span>
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              </button>
              
              <div className="flex items-center gap-4 px-6 py-4 rounded-2xl border border-white/10 text-white/50">
                 <Youtube className="w-6 h-6 text-red-500" />
                 <div className="text-left font-mono">
                   <div className="text-[10px] font-bold leading-none uppercase">TRUSTED_BY</div>
                   <div className="text-xs">500+ Automated Channels</div>
                 </div>
              </div>
            </div>
          </motion.div>

          <motion.div 
            className="relative hidden lg:block"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="aspect-[4/5] bg-gradient-to-b from-white/10 to-transparent border border-white/10 rounded-[40px] overflow-hidden p-8 flex flex-col justify-end relative shadow-2xl">
               <div className="absolute top-0 right-0 p-10 opacity-20">
                 <div className="w-64 h-64 bg-brand-accent rounded-full blur-[120px]" />
               </div>
               
               <div className="bg-white p-8 rounded-3xl text-brand-primary space-y-6 shadow-2xl relative">
                  <div className="flex items-center transition-all hover:scale-105 justify-between p-4 bg-[#F9F9F8] rounded-2xl border border-[#EFEFEF]">
                     <div className="flex items-center gap-4">
                       <div className="w-10 h-10 bg-brand-accent rounded-lg flex items-center justify-center">
                         <Play className="w-5 h-5 text-white fill-current" />
                       </div>
                       <div>
                         <div className="text-[11px] font-bold leading-none">NEW PRODUCTION</div>
                         <div className="text-[9px] opacity-40 font-mono tracking-tighter">FINANCE_NICHE_V4</div>
                       </div>
                     </div>
                     <div className="text-[10px] font-mono text-brand-accent">92%_SYNC</div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="h-2 w-full bg-[#F0F0F0] rounded-full overflow-hidden">
                       <motion.div 
                        className="h-full bg-brand-accent"
                        initial={{ width: "0%" }}
                        animate={{ width: "92%" }}
                        transition={{ duration: 2, delay: 1 }}
                       />
                    </div>
                    <div className="flex justify-between text-[10px] font-mono opacity-40 uppercase">
                       <span>RENDERING_ENGINE</span>
                       <span>4K_HIGH_BITRATE</span>
                    </div>
                  </div>
               </div>
            </div>
            
            <div className="absolute -top-10 -left-10 p-7 bg-brand-accent rounded-3xl shadow-2xl rotate-[-6deg] hover:rotate-0 transition-transform cursor-pointer">
               <div className="text-[10px] font-bold mb-1 font-mono">EST_AD_REVENUE</div>
               <div className="text-3xl font-light tracking-tighter">$4,210.00</div>
               <div className="text-[10px] opacity-60 font-mono mt-1">+24.5% MO_MO_GROWTH</div>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Marquee Features */}
      <div className="border-y border-white/5 py-12 overflow-hidden bg-white/5">
        <div className="flex gap-20 whitespace-nowrap animate-marquee">
           {["GEMINI PRO VISION", "VEO LITE", "GOOGLE CLOUD", "YOUTUBE DATA API", "AUTO SEO", "VOICEOVER AI"].map((text, i) => (
             <div key={i} className="flex items-center gap-4 text-white/20 font-mono text-sm tracking-widest uppercase">
               <div className="w-1.5 h-1.5 bg-brand-accent rounded-full" />
               {text.replace(" ", "_")}
             </div>
           ))}
           {["GEMINI PRO VISION", "VEO LITE", "GOOGLE CLOUD", "YOUTUBE DATA API", "AUTO SEO", "VOICEOVER AI"].map((text, i) => (
             <div key={i+10} className="flex items-center gap-4 text-white/20 font-mono text-sm tracking-widest uppercase">
               <div className="w-1.5 h-1.5 bg-brand-accent rounded-full" />
               {text.replace(" ", "_")}
             </div>
           ))}
        </div>
      </div>
      
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
      `}</style>
    </div>
  );
}
