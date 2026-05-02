import React, { useState, useEffect } from "react";
import { Youtube, Settings, Layout, Globe, Bell, Shield, Zap, Sparkles, ExternalLink, Link as LinkIcon } from "lucide-react";
import { auth, db } from "../lib/firebase";
import { doc, onSnapshot, updateDoc, setDoc, serverTimestamp } from "firebase/firestore";

export default function ChannelManager({ user }: { user: any }) {
  const [profile, setProfile] = useState<any>(null);
  const [niche, setNiche] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "users", user.uid), (snap) => {
      if (snap.exists()) {
        setProfile(snap.data());
        setNiche(snap.data().niche || "");
      } else {
        // Init profile
        setDoc(doc(db, "users", user.uid), {
          uid: user.uid,
          email: user.email,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          youtubeConnected: false
        });
      }
    });

    return unsub;
  }, [user.uid, user.email]);

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      await updateDoc(doc(db, "users", user.uid), {
        niche,
        updatedAt: serverTimestamp()
      });
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const connectChannel = async () => {
    try {
      const resp = await fetch("/api/auth/youtube/url");
      const { url } = await resp.json();
      
      // Open as popup for better iframe compatibility
      const width = 600;
      const height = 700;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      
      window.open(
        url,
        "youtube_auth",
        `width=${width},height=${height},left=${left},top=${top}`
      );
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (event.data?.type === "YOUTUBE_AUTH_SUCCESS") {
        const tokens = event.data.tokens;
        if (tokens?.refresh_token) {
          try {
            await updateDoc(doc(db, "users", user.uid), {
              youtubeConnected: true,
              youtubeRefreshToken: tokens.refresh_token,
              updatedAt: serverTimestamp()
            });
          } catch (err) {
            console.error("Failed to save tokens:", err);
          }
        }
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [user.uid]);

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header>
        <div className="text-[10px] font-mono text-brand-primary/40 uppercase mb-2">SYSTEM_CONFIGURATION</div>
        <h1 className="text-4xl font-medium tracking-tight">Channel Manager</h1>
      </header>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Channel Connection Card */}
          <section className="bg-white border border-[#EFEFEF] rounded-3xl p-8">
             <div className="flex items-center justify-between mb-8">
               <div className="flex items-center gap-4">
                 <div className={`p-3 rounded-2xl ${profile?.youtubeConnected ? 'bg-red-50 text-red-500' : 'bg-gray-50 text-gray-400'}`}>
                   <Youtube className="w-8 h-8" />
                 </div>
                 <div>
                   <h3 className="text-xl font-medium">YouTube Integration</h3>
                   <p className="text-xs text-brand-primary/40">Status: {profile?.youtubeConnected ? 'Linked' : 'Not Connected'}</p>
                 </div>
               </div>
               
               {profile?.youtubeConnected ? (
                 <div className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-600 rounded-full text-xs font-semibold shadow-sm border border-green-100">
                   <Shield className="w-3 h-3" /> Secure Auth Active
                 </div>
               ) : (
                 <div className="text-[10px] font-mono text-brand-accent animate-pulse px-3 py-1 bg-brand-accent/5 rounded-full border border-brand-accent/10 font-bold">
                    CREDENTIALS_REQUIRED
                 </div>
               )}
             </div>

             {!profile?.youtubeConnected ? (
               <div className="space-y-6">
                 <div className="p-6 bg-brand-primary/5 rounded-2xl border border-brand-primary/5">
                   <h4 className="text-[11px] font-bold text-brand-primary mb-3 uppercase tracking-widest flex items-center gap-2">
                     <Settings className="w-3.5 h-3.5" /> API Setup Guide
                   </h4>
                   <p className="text-xs text-brand-primary/60 mb-4 leading-relaxed font-light">
                     To connect your real YouTube channel for autonomous uploads, you must provide your own Google Cloud credentials:
                   </p>
                   <ul className="text-[10px] space-y-3 text-brand-primary/50 list-none font-mono">
                     <li className="flex gap-3">
                       <span className="flex-shrink-0 w-4 h-4 bg-brand-primary text-white rounded-full flex items-center justify-center text-[8px] font-bold">1</span>
                       <span>Go to <a href="https://console.cloud.google.com/" target="_blank" className="text-brand-accent underline">Google Cloud Console</a> & create a project.</span>
                     </li>
                     <li className="flex gap-3">
                       <span className="flex-shrink-0 w-4 h-4 bg-brand-primary text-white rounded-full flex items-center justify-center text-[8px] font-bold">2</span>
                       <span>Enable <strong>YouTube Data API v3</strong> in the Library.</span>
                     </li>
                     <li className="flex gap-3">
                       <span className="flex-shrink-0 w-4 h-4 bg-brand-primary text-white rounded-full flex items-center justify-center text-[8px] font-bold">3</span>
                       <span>Create <strong>OAuth 2.0 Web Client ID</strong>. Use <code>{window.location.origin}/api/auth/youtube/callback</code> for Authorized Redirect URI.</span>
                     </li>
                     <li className="flex gap-3">
                       <span className="flex-shrink-0 w-4 h-4 bg-brand-primary text-white rounded-full flex items-center justify-center text-[8px] font-bold">4</span>
                       <span>Add <strong>NOVA_API_KEY</strong>, <strong>GOOGLE_CLIENT_ID</strong>, and <strong>GOOGLE_CLIENT_SECRET</strong> to your <strong>Secrets</strong> panel.</span>
                     </li>
                     <li className="flex gap-3 p-2 bg-brand-accent/5 rounded-lg border border-brand-accent/20">
                       <span className="flex-shrink-0 w-4 h-4 bg-brand-accent text-white rounded-full flex items-center justify-center text-[8px] font-bold">!</span>
                       <span><strong>CRITICAL:</strong> In Google Cloud under "OAuth consent screen", you MUST add your email (<code>{user.email}</code>) as a <strong>Test User</strong> to bypass the 403 error.</span>
                     </li>
                   </ul>
                 </div>
                 <button 
                  onClick={connectChannel}
                  className="w-full py-4 bg-brand-primary text-white rounded-2xl text-xs font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-brand-accent transition-all shadow-xl shadow-brand-primary/10 active:scale-[0.99]"
                 >
                   <Youtube className="w-4 h-4" /> Link Your Channel
                 </button>
               </div>
             ) : (
               <div className="p-6 bg-[#F9F9F8] rounded-2xl flex items-center justify-between border border-[#EFEFEF]">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-brand-accent rounded-2xl overflow-hidden flex items-center justify-center text-white font-bold shadow-lg shadow-brand-accent/20">
                       <div className="text-lg">AI</div>
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-brand-primary">{profile.displayName || "Faceless Production v1"}</div>
                      <div className="text-[10px] text-brand-primary/40 font-mono tracking-tighter truncate max-w-[150px]">{profile.youtubeChannelId || "CHANNEL_SYNC_ACTIVE"}</div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <button className="text-[10px] font-bold text-brand-accent hover:underline flex items-center gap-1 uppercase tracking-widest">
                      Revoke Tokens <ExternalLink className="w-3 h-3" />
                    </button>
                    <div className="text-[9px] text-green-500 font-mono">STATUS: STABLE_CONNECTION</div>
                  </div>
               </div>
             )}
          </section>

          {/* AI Niche Settings */}
          <section className="bg-white border border-[#EFEFEF] rounded-3xl p-8 space-y-6">
             <div className="flex items-center gap-2">
               <Sparkles className="w-5 h-5 text-brand-accent" />
               <h3 className="text-xl font-medium">AI Persona & Niche</h3>
             </div>
             
             <div className="space-y-4">
               <div>
                  <label className="text-[10px] font-mono text-brand-primary/40 uppercase block mb-2">TARGET_NICHE</label>
                  <input 
                    type="text"
                    value={niche}
                    onChange={(e) => setNiche(e.target.value)}
                    placeholder="e.g. Personal Finance, Mystery Stories, Space Tech"
                    className="w-full bg-[#F9F9F8] border-none rounded-xl p-4 text-sm focus:ring-2 focus:ring-brand-accent/20"
                  />
                  <p className="mt-2 text-[10px] text-brand-primary/40 italic">This helps our AI optimize scripts and SEO metadata for your specific audience.</p>
               </div>

               <div className="grid md:grid-cols-2 gap-6">
                 <div>
                    <label className="text-[10px] font-mono text-brand-primary/40 uppercase block mb-2">VOICEOVER_STYLE</label>
                    <select className="w-full bg-[#F9F9F8] border-none rounded-xl p-4 text-sm focus:ring-2 focus:ring-brand-accent/20 appearance-none">
                      <option>Professional Male (Atlas)</option>
                      <option>Friendly Female (Luna)</option>
                      <option>Deep Narrative (Vader)</option>
                      <option>Energetic (Spark)</option>
                    </select>
                 </div>
                 <div>
                    <label className="text-[10px] font-mono text-brand-primary/40 uppercase block mb-2">MUSIC_MOOD</label>
                    <select className="w-full bg-[#F9F9F8] border-none rounded-xl p-4 text-sm focus:ring-2 focus:ring-brand-accent/20 appearance-none">
                      <option>Cinematic / Epic</option>
                      <option>Lo-fi / Relaxing</option>
                      <option>Tense / Mysterious</option>
                      <option>Upbeat / Tech</option>
                    </select>
                 </div>
               </div>
             </div>

             <div className="pt-4">
               <button 
                onClick={handleSaveSettings}
                disabled={isSaving}
                className="px-8 py-3 bg-brand-primary text-white rounded-full text-sm font-semibold hover:bg-brand-accent transition-colors disabled:opacity-50"
               >
                 {isSaving ? "Saving..." : "Update Preferences"}
               </button>
             </div>
          </section>
        </div>

        {/* Sidebar Settings */}
        <div className="space-y-8">
           <div className="bg-brand-primary p-8 rounded-3xl text-white relative overflow-hidden">
              <Zap className="w-32 h-32 absolute -right-8 -bottom-8 text-white/5 rotate-12" />
              <div className="relative">
                <div className="text-[10px] font-mono text-white/40 uppercase mb-4">AUTOMATION_ENGINE</div>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-light">Auto-Publish</span>
                    <div className="w-10 h-5 bg-brand-accent rounded-full relative">
                      <div className="w-3 h-3 bg-white rounded-full absolute right-1 top-1" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-light">SEO Optimization</span>
                    <div className="w-10 h-5 bg-brand-accent rounded-full relative">
                      <div className="w-3 h-3 bg-white rounded-full absolute right-1 top-1" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-light">Daily Scheduler</span>
                    <div className="w-10 h-5 bg-white/20 rounded-full relative">
                      <div className="w-3 h-3 bg-white/40 rounded-full absolute left-1 top-1" />
                    </div>
                  </div>
                </div>
              </div>
           </div>

           <div className="bg-white border border-[#EFEFEF] rounded-3xl p-8">
              <h4 className="text-sm font-medium mb-4 flex items-center gap-2">
                <Bell className="w-4 h-4 text-brand-accent" /> Notification Hub
              </h4>
              <div className="space-y-4">
                 {[
                   { t: "Viral Alert", d: "Video #04 is trending 40% faster than average." },
                   { t: "Generation Complete", d: "Script for 'Next 100 Years' is ready." }
                 ].map((n, i) => (
                   <div key={i} className="p-3 bg-[#F9F9F8] rounded-xl border border-[#F0F0F0]">
                      <div className="text-[10px] font-bold text-brand-primary mb-1">{n.t}</div>
                      <div className="text-[10px] text-brand-primary/40">{n.d}</div>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
