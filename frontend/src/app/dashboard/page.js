"use client";

import React, { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import ContentSwitcher from "./components/ContentSwitcher";

export default function DashboardPage() {
  const [selected, setSelected] = useState("activities");
  const [user, setUser] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/auth/me");
        const j = await res.json();
        if (j?.user) setUser(j.user);
      } catch {}
    })();
  }, []);

  return (
    <div className="h-screen bg-[#F1F8F8] flex overflow-hidden">
      <Sidebar selected={selected} onSelect={setSelected} />

      <div className="flex-1 flex flex-col">
        <Topbar user={user} />
        <div className="p-6 overflow-auto">
          <ContentSwitcher selected={selected} />
        </div>
      </div>
    </div>
  );
}
