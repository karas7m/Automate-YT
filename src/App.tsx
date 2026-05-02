import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, db } from "./lib/firebase";
import Layout from "./components/Layout";
import Dashboard from "./components/Dashboard";
import VideoCreator from "./components/VideoCreator";
import ProjectList from "./components/ProjectList";
import ChannelManager from "./components/ChannelManager";
import LandingPage from "./components/LandingPage";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#F9F9F8]">
        <div className="text-2xl font-mono tracking-tighter animate-pulse">AUTOCHANNEL_AI</div>
      </div>
    );
  }

  if (!user) {
    return <LandingPage />;
  }

  return (
    <Router>
      <Layout user={user}>
        <Routes>
          <Route path="/" element={<Dashboard user={user} />} />
          <Route path="/create" element={<VideoCreator user={user} />} />
          <Route path="/projects" element={<ProjectList user={user} />} />
          <Route path="/channel" element={<ChannelManager user={user} />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Layout>
    </Router>
  );
}
