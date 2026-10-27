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

  useEffect(() => {
    const handleSectionChange = (event) => {
      if (typeof event.detail === "string") setSelected(event.detail);
    };
    window.addEventListener("switch-section", handleSectionChange);
    return () => window.removeEventListener("switch-section", handleSectionChange);
  }, []);

  return (
    <div className="flex h-dvh min-h-[600px] overflow-hidden bg-[#eef4f3]">
      <Sidebar selected={selected} onSelect={setSelected} />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar user={user} />

        <div className="flex-1 overflow-auto p-3 sm:p-5 lg:p-6">
          <ContentSwitcher selected={selected} />
        </div>
      </div>
    </div>
  );
}