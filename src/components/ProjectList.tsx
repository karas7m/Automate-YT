import React, { useEffect, useState } from "react";
import { collection, query, where, onSnapshot, orderBy, updateDoc, doc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";
import { Video, Calendar, MoreVertical, ExternalLink, Trash2, Send, Clock, CheckCircle, Youtube } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function ProjectList({ user }: { user: any }) {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, "projects"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const p = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setProjects(p);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "projects");
    });

    return unsubscribe;
  }, [user.uid]);

  const handlePostNow = async (projectId: string) => {
    try {
      await updateDoc(doc(db, "projects", projectId), {
        status: "posted",
        postedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async (projectId: string) => {
    if (window.confirm("Are you sure you want to delete this project?")) {
      try {
        await deleteDoc(doc(db, "projects", projectId));
      } catch (error) {
        console.error(error);
      }
    }
  };

  if (loading) return <div>Loading projects...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex justify-between items-end">
        <div>
          <div className="text-[10px] font-mono text-brand-primary/40 uppercase mb-2">PRODUCTION_HISTORY</div>
          <h1 className="text-4xl font-medium tracking-tight">Your Projects</h1>
        </div>
        <div className="text-xs text-brand-primary/40">Showing {projects.length} artifacts</div>
      </header>

      {projects.length === 0 ? (
        <div className="py-32 flex flex-col items-center justify-center text-center opacity-40">
           <Video className="w-16 h-16 mb-4 stroke-1" />
           <p className="text-xl font-light">Your library is currently empty.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          <AnimatePresence>
            {projects.map((project) => (
              <motion.div
                key={project.id}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white border border-[#EFEFEF] rounded-2xl p-6 flex flex-col md:flex-row gap-6 hover:shadow-sm transition-shadow"
              >
                {/* Thumbnail Placeholder */}
                <div className="w-full md:w-56 aspect-video bg-[#F5F5F5] rounded-xl flex items-center justify-center overflow-hidden relative group">
                   <Video className="w-8 h-8 text-brand-primary/10 group-hover:scale-110 transition-transform" />
                   {project.status === "posted" && (
                     <div className="absolute top-2 right-2 px-2 py-1 bg-green-500 text-white rounded text-[10px] font-bold">POSTED</div>
                   )}
                </div>

                <div className="flex-1 flex flex-col">
                   <div className="flex justify-between items-start mb-2">
                     <div>
                       <h3 className="text-lg font-medium">{project.title}</h3>
                       <div className="flex gap-4 mt-2">
                         <div className="flex items-center gap-1.5 text-xs text-brand-primary/40">
                            <Clock className="w-3 h-3" />
                            {new Date(project.createdAt?.seconds * 1000).toLocaleDateString()}
                         </div>
                         <div className="flex items-center gap-1.5 text-xs text-brand-primary/40">
                            <Youtube className="w-3 h-3 text-red-500" />
                            {project.aspectRatio === "9:16" ? "Shorts" : "Landscape"}
                         </div>
                       </div>
                     </div>
                     <div className="flex gap-2">
                        <button className="p-2 hover:bg-[#F5F5F5] rounded-full transition-colors text-brand-primary/40">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                     </div>
                   </div>

                   <p className="text-sm text-brand-primary/40 line-clamp-2 mt-2 leading-relaxed font-light">
                      {project.prompt}
                   </p>

                   <div className="mt-auto pt-6 flex items-center justify-between">
                      <div className="flex gap-4">
                        {project.status === "ready" ? (
                          <>
                            <button 
                              onClick={() => handlePostNow(project.id)}
                              className="px-6 py-2 bg-brand-primary text-white text-xs font-semibold rounded-full flex items-center gap-2 hover:bg-brand-accent transition-colors"
                            >
                               <Send className="w-3 h-3" /> Post Now
                            </button>
                            <button className="px-6 py-2 border border-brand-primary text-brand-primary text-xs font-semibold rounded-full flex items-center gap-2 hover:bg-[#F5F5F5] transition-colors">
                               <Calendar className="w-3 h-3" /> Schedule
                            </button>
                          </>
                        ) : project.status === "posted" ? (
                          <div className="px-4 py-2 bg-green-50 text-green-600 rounded-full text-xs font-semibold flex items-center gap-2">
                             <CheckCircle className="w-3 h-3" /> Published to YouTube
                          </div>
                        ) : (
                          <div className="px-4 py-2 bg-orange-50 text-orange-600 rounded-full text-xs font-semibold flex items-center gap-2 italic">
                             Status: {project.status}
                          </div>
                        )}
                      </div>

                      <div className="flex gap-3">
                        <button 
                          onClick={() => handleDelete(project.id)}
                          className="p-2 text-red-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-brand-primary/20 hover:text-brand-primary hover:bg-[#F5F5F5] rounded-full transition-all">
                          <ExternalLink className="w-4 h-4" />
                        </button>
                      </div>
                   </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
