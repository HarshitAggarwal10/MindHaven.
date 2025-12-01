"use client";

export default function ActivityRow({ title, time }) {
  return (
    <div className="rounded-xl p-3 border bg-white flex items-center justify-between">
      <div>
        <div className="font-medium text-gray-700">{title}</div>
        <div className="text-xs text-gray-400">{time}</div>
      </div>
      <div className="text-sm text-teal-600 font-medium">Open</div>
    </div>
  );
}
