import React, { useState } from "react";
import { Sparkles, Wand2, Type as TypeIcon, Music, Play, Layout, CheckCircle2, Loader2, AlertCircle, Video } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { MODELS, ai, GoogleGenAI, Type as GeminiType } from "../lib/gemini";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { Link } from "react-router-dom";

type Step = "input" | "scripting" | "visuals" | "rendering" | "completed";

export default function VideoCreator({ user }: { user: any }) {
  const [step, setStep] = useState<Step>("input");
  const [topic, setTopic] = useState("");
  const [aspectRatio, setAspectRatio] = useState<"16:9" | "9:16">("16:9");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [needsApiKey, setNeedsApiKey] = useState(false);

  const handleKeySelection = async () => {
    if ((window as any).aistudio) {
      await (window as any).aistudio.openSelectKey();
      setNeedsApiKey(false);
    }
  };

  const startGeneration = async () => {
    if (!topic) return;

    // Check for Veo API key selection if using Veo
    if ((window as any).aistudio) {
      const hasKey = await (window as any).aistudio.hasSelectedApiKey();
      if (!hasKey) {
        setNeedsApiKey(true);
        setError("A Google Cloud API key is required for Veo generation. If you are on the free tier, you may still have available quota.");
        return;
      }
    }

    setIsGenerating(true);
    setError(null);
    setVideoUrl(null);
    setStep("scripting");

    try {
      // 1. Generate Script and Metadata using Frontend SDK
      const prompt = `Generate a YouTube video script and metadata for a faceless video about: "${topic}".`;

      const response = await ai.models.generateContent({
        model: MODELS.FLASH,
        config: {
          systemInstruction: "You are an expert YouTube strategist. Output ONLY valid JSON in the requested format.",
          responseMimeType: "application/json",
          responseSchema: {
            type: GeminiType.OBJECT,
            properties: {
              title: { type: GeminiType.STRING },
              description: { type: GeminiType.STRING },
              tags: { type: GeminiType.ARRAY, items: { type: GeminiType.STRING } },
              script: {
                type: GeminiType.ARRAY,
                items: {
                  type: GeminiType.OBJECT,
                  properties: {
                    segment: { type: GeminiType.NUMBER },
                    text: { type: GeminiType.STRING },
                    visualPrompt: { type: GeminiType.STRING }
                  },
                  required: ["segment", "text", "visualPrompt"]
                }
              }
            },
            required: ["title", "description", "tags", "script"]
          }
        },
        contents: prompt
      });
      
      const text = response.text;
      if (!text) {
        throw new Error("AI synthesis returned an empty sequence. Check thermal state.");
      }
      
      const data = JSON.parse(text.replace(/```json\n?|```/g, "").trim());
      setGeneratedContent(data);

      setStep("visuals");
      // 2. Generate a key scene video using Veo 3
      const videoPrompt = data.script?.[0]?.visualPrompt || topic;
      
      // Instantiate fresh SDK for Veo to ensure it picks up any new keys
      const freshAi = new GoogleGenAI({ apiKey: (process.env as any).API_KEY || (process.env as any).GEMINI_API_KEY });
      
      let operation = await freshAi.models.generateVideos({
        model: MODELS.VIDEO,
        prompt: `High quality cinematic video: ${videoPrompt}`,
        config: {
          numberOfVideos: 1,
          resolution: "1080p",
          aspectRatio: aspectRatio
        }
      });

      setStep("rendering");
      
      // Poll for video completion
      let pollCount = 0;
      const maxPolls = 30; // ~5 mins at 10s intervals
      while (!operation.done && pollCount < maxPolls) {
        await new Promise(r => setTimeout(r, 10000));
        operation = await freshAi.operations.getVideosOperation({ operation });
        pollCount++;
        console.log(`[VIDEO_GEN] Polling... (${pollCount}/${maxPolls})`);
      }

      if (!operation.done) {
        throw new Error("Video generation timed out. It may still be processing in the background.");
      }

      const downloadUri = (operation as any).response?.generatedVideos?.[0]?.video?.uri;
      if (downloadUri) {
        // Fetch video with API key header
        const videoResponse = await fetch(downloadUri, {
          headers: { 'x-goog-api-key': (process.env as any).API_KEY || (process.env as any).GEMINI_API_KEY }
        });
        const blob = await videoResponse.blob();
        setVideoUrl(URL.createObjectURL(blob));
      }

      // Save to Firestore
      await addDoc(collection(db, "projects"), {
        userId: user.uid,
        title: data.title || topic,
        prompt: topic,
        script: data.script ? JSON.stringify(data.script) : "",
        videoUrl: downloadUri || "", // Storing URI for reference
        status: "ready",
        aspectRatio,
        metadata: {
          description: data.description,
          tags: data.tags,
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setStep("completed");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "AI Generation failed. Please try again.");
      setStep("input");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 md:space-y-12 py-4 md:py-8 pb-32 md:pb-12">
      <header className="space-y-2 md:space-y-4">
        <div className="text-[10px] font-mono text-brand-primary/40 uppercase tracking-[0.2em] mb-1">MODULE_02 // GENERATION</div>
        <h1 className="text-4xl md:text-5xl font-medium tracking-tight">Create AI Video</h1>
        <p className="text-brand-primary/40 text-sm md:text-lg font-light max-w-xl">
          Autonomous orchestration of scripting, visuals, and voiceover.
        </p>
      </header>

      <div className="bg-white border border-[#EFEFEF] rounded-3xl shadow-sm overflow-hidden">
        <AnimatePresence mode="wait">
          {step === "input" && (
            <motion.div 
              key="input"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="divide-y divide-[#F0F0F0]"
            >
              <div className="p-6 md:p-10 space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[10px] font-mono text-brand-primary/40 uppercase tracking-widest">INPUT_TOPIC</label>
                  <span className="text-[9px] font-mono text-brand-accent px-2 py-0.5 bg-brand-accent/10 rounded">REQUIRED</span>
                </div>
                <textarea
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. 5 Habits of highly productive people at 5 AM..."
                  className="w-full bg-[#F9F9F8] border border-[#EFEFEF] rounded-2xl p-6 text-lg md:text-xl placeholder:text-brand-primary/10 focus:ring-1 focus:ring-brand-accent/20 min-h-[160px] resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#F0F0F0]">
                <div className="p-6 md:p-10 space-y-6">
                  <label className="text-[10px] font-mono text-brand-primary/40 uppercase tracking-widest">OUTPUT_FORMAT</label>
                  <div className="flex gap-4">
                    <button
                      onClick={() => setAspectRatio("16:9")}
                      className={`flex-1 p-4 rounded-2xl border transition-all flex flex-col items-center gap-2 ${
                        aspectRatio === "16:9" ? "border-brand-accent bg-brand-accent/5 ring-4 ring-brand-accent/5" : "border-[#EFEFEF] text-brand-primary/40 grayscale"
                      }`}
                    >
                      <Video className="w-5 h-5" />
                      <span className="text-[10px] font-bold uppercase tracking-tighter">16:9_Youtube</span>
                    </button>
                    <button
                      onClick={() => setAspectRatio("9:16")}
                      className={`flex-1 p-4 rounded-2xl border transition-all flex flex-col items-center gap-2 ${
                        aspectRatio === "9:16" ? "border-brand-accent bg-brand-accent/5 ring-4 ring-brand-accent/5" : "border-[#EFEFEF] text-brand-primary/40 grayscale"
                      }`}
                    >
                      <Layout className="w-5 h-5" />
                      <span className="text-[10px] font-bold uppercase tracking-tighter">9:16_Shorts</span>
                    </button>
                  </div>
                </div>

                <div className="p-6 md:p-10 space-y-6">
                  <label className="text-[10px] font-mono text-brand-primary/40 uppercase tracking-widest">ENGINE_PRESETS</label>
                  <div className="grid grid-cols-2 gap-2">
                     {["4K_HD", "CLEAR_VO", "DYNAMIC_SUB", "B_ROLL_AI"].map(p => (
                       <div key={p} className="px-3 py-2 bg-[#F9F9F8] rounded-xl text-[9px] font-mono text-brand-primary/60 border border-[#EFEFEF] flex items-center gap-2">
                         <div className="w-1 h-1 bg-brand-accent rounded-full animate-pulse" />
                         {p}
                       </div>
                     ))}
                  </div>
                </div>
              </div>

              <div className="p-6 md:p-10 bg-[#F9F9F8]/50">
                {error && (
                  <div className="mb-6 p-4 bg-red-50 text-red-500 rounded-xl flex items-center gap-3 text-sm border border-red-100">
                    <AlertCircle className="w-4 h-4" />
                    <div className="flex-1">
                      {error}
                      {needsApiKey && (
                        <button 
                          onClick={handleKeySelection}
                          className="ml-2 underline font-bold hover:text-red-700"
                        >
                          Connect Paid Key
                        </button>
                      )}
                    </div>
                  </div>
                )}

                <button
                  onClick={startGeneration}
                  disabled={!topic || isGenerating}
                  className="w-full py-5 bg-brand-primary text-white rounded-2xl font-bold text-base md:text-lg flex items-center justify-center gap-3 active:scale-[0.99] transition-all disabled:opacity-50 shadow-xl shadow-brand-primary/20"
                >
                  <Sparkles className="w-5 h-5 fill-current" />
                  Initiate Sequence
                </button>
                <div className="text-center mt-4 text-[9px] font-mono text-brand-primary/20">EST_TIME: ~1:30 MIN // ENGINE: VEO_3_LITE</div>
              </div>
            </motion.div>
          )}

          {step !== "input" && step !== "completed" && (
            <motion.div 
               key="generating"
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="py-20 md:py-32 flex flex-col items-center justify-center text-center space-y-12 px-6"
            >
               <div className="relative">
                 <motion.div 
                   animate={{ rotate: 360 }}
                   transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                   className="w-24 h-24 border-2 border-dashed border-brand-accent/20 rounded-full flex items-center justify-center"
                 >
                   <div className="w-16 h-16 border-2 border-brand-accent rounded-full border-t-transparent animate-spin" />
                 </motion.div>
                 <Sparkles className="w-6 h-6 text-brand-accent absolute inset-0 m-auto animate-pulse" />
               </div>

               <div className="space-y-4">
                 <div className="text-[10px] font-mono text-brand-accent uppercase tracking-[0.4em] animate-pulse">Running_Module_{step}</div>
                 <h2 className="text-2xl md:text-3xl font-medium">Synthesizing Content...</h2>
                 <p className="text-brand-primary/40 text-xs md:text-sm font-mono max-w-xs mx-auto">
                  {step === "scripting" && "[0x1] Constructing narrative logic structure..."}
                  {step === "visuals" && "[0x2] Indexing stock assets via visual_orchestrator..."}
                  {step === "rendering" && "[0x3] Encoding H.265 / VEO_LITE composite frame..."}
                 </p>
                 <div className="text-[9px] text-brand-primary/20 italic">Generation with Veo Lite is usually faster (1-2 mins).</div>
               </div>

               <div className="w-full max-w-sm">
                 <div className="h-1 bg-[#F5F5F5] rounded-full overflow-hidden">
                   <motion.div 
                     className="h-full bg-brand-accent shadow-[0_0_10px_rgba(255,99,33,0.5)]" 
                     initial={{ width: "0%" }}
                     animate={{ 
                       width: step === "scripting" ? "33%" : step === "visuals" ? "66%" : "95%" 
                     }}
                     transition={{ duration: 2 }}
                   />
                 </div>
               </div>
            </motion.div>
          )}

          {step === "completed" && (
            <motion.div 
              key="completed"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-6 md:p-10 flex flex-col items-center justify-center text-center space-y-8"
            >
               {videoUrl ? (
                 <div className="w-full aspect-video rounded-2xl overflow-hidden bg-black shadow-2xl relative group">
                    <video 
                      src={videoUrl} 
                      controls 
                      autoPlay 
                      loop 
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute top-4 right-4 bg-brand-accent text-white text-[9px] font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-lg">
                      <Sparkles className="w-3 h-3" />
                      VEO_LITE_GEN
                    </div>
                 </div>
               ) : (
                 <div className="w-24 h-24 bg-green-500 rounded-full items-center justify-center mb-4 inline-flex shadow-2xl shadow-green-500/20 relative">
                   <div className="absolute inset-x-[-20%] inset-y-[-20%] border-2 border-dashed border-green-500/20 rounded-full animate-spin [animation-duration:10s]" />
                   <CheckCircle2 className="w-12 h-12 text-white" />
                 </div>
               )}

               <div className="space-y-3 px-6">
                 <h2 className="text-3xl md:text-4xl font-medium tracking-tight">Production Log // OK</h2>
                 <p className="text-brand-primary/40 max-w-md mx-auto text-sm leading-relaxed">
                    VEO 3 module synthesis completed. Project metadata injected. System ready for publication to YouTube.
                 </p>
               </div>
               
               <div className="flex flex-col sm:flex-row gap-4 px-6 w-full max-w-sm">
                 <button 
                  onClick={() => setStep("input")}
                  className="flex-1 py-4 bg-brand-primary text-white rounded-2xl font-bold tracking-widest text-[10px] uppercase shadow-xl shadow-brand-primary/20"
                 >
                   Return to Terminal
                 </button>
                 <Link
                   to="/projects"
                   className="flex-1 py-4 border border-[#EFEFEF] bg-[#F9F9F8] rounded-2xl font-bold tracking-widest text-[10px] uppercase text-brand-primary hover:bg-[#F0F0F0] transition-colors"
                 >
                   Manage_Library
                 </Link>
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Preset Bank */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Motivaton_Bank", icon: Sparkles },
          { label: "Edu_Structure", icon: TypeIcon },
          { label: "News_Crawl", icon: Music },
          { label: "Dev_Vlog", icon: Play },
        ].map((t, i) => (
          <motion.button 
            key={i} 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 + i * 0.1 }}
            className="p-5 bg-white border border-[#EFEFEF] rounded-2xl flex items-center gap-4 text-[10px] font-mono font-medium hover:border-brand-accent hover:text-brand-accent transition-all group"
          >
            <t.icon className="w-4 h-4 text-brand-primary/20 group-hover:text-brand-accent transition-colors" />
            {t.label}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
