"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { auth } from "../../firebase/client";
import { signOut, onAuthStateChanged } from "firebase/auth";

export default function DashboardPage() {
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) router.push("/login");
      else setUser(u);
    });
    return () => unsub();
  }, [router]);

  const features = [
    { name: "Digital Diary", path: "/diary" },
    { name: "AI Mood Tracker", path: "/mood" },
    { name: "Community", path: "/community" },
    { name: "Therapy Appointments", path: "/appointments" },
    { name: "Wellness Camps", path: "/camps" },
  ];

  return (
    <div className="p-10 text-center">
      <h1 className="text-3xl font-bold mb-4">
        Welcome, {user?.email?.split("@")[0]}
      </h1>
      <p className="text-gray-600 mb-8">Choose where you'd like to go:</p>

      <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        {features.map((f) => (
          <button
            key={f.name}
            onClick={() => router.push(f.path)}
            className="border border-gray-300 rounded-xl p-6 bg-white shadow hover:shadow-md hover:-translate-y-1 transition"
          >
            {f.name}
          </button>
        ))}
      </div>

      <button
        onClick={() => signOut(auth)}
        className="mt-10 text-red-500 underline"
      >
        Log Out
      </button>
    </div>
  );
}
