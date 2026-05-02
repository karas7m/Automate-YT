import React, { useEffect, useState } from "react";
import { collection, query, where, getDocs, limit, orderBy } from "firebase/firestore";
import { db } from "../lib/firebase";
import { TrendingUp, Users, Video, Clock, ArrowRight, Sparkles } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import { Link } from "react-router-dom";
import { motion } from "motion/react";

const MOCK_DATA = [
  { name: "Mon", views: 400 },
  { name: "Tue", views: 3000 },
  { name: "Wed", views: 2000 },
  { name: "Thu", views: 2780 },
  { name: "Fri", views: 1890 },
  { name: "Sat", views: 2390 },
  { name: "Sun", views: 3490 },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export default function Dashboard({ user }: { user: any }) {
  const [stats, setStats] = useState({
    totalProjects: 0,
    totalViews: 12450,
    activeProjects: 0,
    recentProjects: [] as any[],
  });

  useEffect(() => {
    async function fetchStats() {
      const q = query(
        collection(db, "projects"), 
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc"),
        limit(3)
      );
      
      const snap = await getDocs(q);
      const projects = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      setStats(prev => ({
        ...prev,
        totalProjects: snap.size,
        recentProjects: projects,
      }));
    }
    fetchStats();
  }, [user.uid]);

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-8 pb-10"
    >
      <motion.header variants={item}>
        <div className="text-[10px] font-mono text-brand-primary/40 uppercase mb-2 tracking-[0.2em]">SYSTEM_OVERVIEW</div>
        <h1 className="text-4xl md:text-5xl font-medium tracking-tight">Channel Health</h1>
      </motion.header>

      {/* Quick Stats Grid */}
      <motion.div variants={container} className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {[
          { label: "Total Views", value: stats.totalViews.toLocaleString(), icon: TrendingUp, trend: "+12%" },
          { label: "Projects", value: stats.totalProjects, icon: Video, trend: null },
          { label: "Avg. Retention", value: "64%", icon: Users, trend: "+4%" },
          { label: "Next Post", value: "Today, 18:00", icon: Clock, trend: null },
        ].map((stat, i) => (
          <motion.div 
            key={i} 
            variants={item}
            whileHover={{ y: -5 }}
            className="p-5 md:p-6 bg-white border border-[#EFEFEF] rounded-2xl md:rounded-3xl shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-[#F9F9F8] rounded-xl">
                <stat.icon className="w-4 h-4 text-brand-primary" />
              </div>
              {stat.trend && (
                <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                  {stat.trend}
                </span>
              )}
            </div>
            <div className="text-xl md:text-2xl font-medium tracking-tighter">{stat.value}</div>
            <div className="text-[10px] md:text-xs text-brand-primary/40 font-medium uppercase tracking-wider">{stat.label}</div>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <motion.div variants={item} className="lg:col-span-2 p-6 md:p-8 bg-white border border-[#EFEFEF] rounded-3xl shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-8">
            <h3 className="font-semibold text-lg">Engagement Trends</h3>
            <div className="flex gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-brand-accent my-auto" />
              <span className="text-[10px] font-mono text-brand-primary/40 uppercase">VIEWS_PER_DAY</span>
            </div>
          </div>
          <div className="h-[250px] md:h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={MOCK_DATA}>
                <defs>
                  <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF6321" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#FF6321" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="6 6" vertical={false} stroke="#F0F0F0" />
                <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} tick={{fill: '#999'}} dy={10} />
                <YAxis fontSize={10} tickLine={false} axisLine={false} tick={{fill: '#999'}} />
                <Tooltip 
                  contentStyle={{ border: 'none', borderRadius: '16px', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ color: '#FF6321', fontWeight: 600 }}
                  cursor={{ stroke: '#FF6321', strokeWidth: 1, strokeDasharray: '4 4' }}
                />
                <Area type="monotone" dataKey="views" stroke="#FF6321" strokeWidth={3} fillOpacity={1} fill="url(#colorViews)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Sidebar Project Feed */}
        <motion.div variants={item} className="p-6 md:p-8 bg-white border border-[#EFEFEF] rounded-3xl shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-8">
            <h3 className="font-semibold">Recent Work</h3>
            <Link to="/projects" className="text-xs text-brand-accent font-medium flex items-center gap-1 hover:gap-2 transition-all">
              All projects <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-6 flex-1">
            {stats.recentProjects.length > 0 ? (
              stats.recentProjects.map((p, idx) => (
                <motion.div 
                  key={p.id} 
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + idx * 0.1 }}
                  className="group cursor-pointer border-b border-[#F5F5F5] pb-4 last:border-0"
                >
                  <div className="text-[9px] font-mono text-brand-primary/30 uppercase mb-1">{p.status}</div>
                  <div className="text-sm font-medium group-hover:text-brand-accent transition-colors truncate">{p.title}</div>
                  <div className="text-[10px] text-brand-primary/20 mt-1">
                    {new Date(p.createdAt?.seconds * 1000).toLocaleDateString()}
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-40 py-10">
                <Video className="w-10 h-10 mb-4 stroke-1" />
                <p className="text-xs">Initial sync completed.</p>
                <Link to="/create" className="text-xs text-brand-accent mt-2 hover:underline">Start creating</Link>
              </div>
            )}
          </div>
          
          <div className="mt-8 p-4 bg-brand-primary/5 rounded-2xl flex items-center justify-between border border-brand-primary/10">
             <div className="flex items-center gap-3">
               <div className="bg-brand-accent p-2.5 rounded-xl shadow-lg shadow-brand-accent/20">
                 <Sparkles className="w-4 h-4 text-white" />
               </div>
               <div>
                  <div className="text-[11px] font-bold">Nova AI Active</div>
                  <div className="text-[9px] text-brand-primary/40 uppercase tracking-wider">Cloud Engine v2</div>
               </div>
             </div>
             <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse ring-4 ring-green-500/10" />
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
