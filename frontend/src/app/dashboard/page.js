"use client";

import React, { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import ContentSwitcher from "./components/ContentSwitcher";

export default function DashboardPage() {
  const [selected, setSelected] = useState("activities");
  const [user, setUser] = useState(null);

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();

        if (data?.user) {
          setUser(data.user);
        }
      } catch (err) {
        console.error("Failed to fetch user:", err);
      }
    }

    fetchUser();
  }, []);

  return (
    <div className="h-screen bg-[#F1F8F8] flex overflow-hidden">
      <Sidebar selected={selected} onSelect={setSelected} />

      <div className="flex-1 flex flex-col">
        <Topbar user={user} />

        <div className="p-6 overflow-auto flex-1">
          <ContentSwitcher selected={selected} />
        </div>
      </div>
    </div>
  );
}