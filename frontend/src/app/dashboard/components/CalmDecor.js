"use client";

import { motion } from "framer-motion";
import React from "react";

/**
 * Small decorative component (SVG blob + floating leaves)
 * Lightweight, calming effect used in section headers.
 */

export default function CalmDecor({ className = "w-40 h-24" }) {
  return (
    <motion.div
      className={`relative ${className}`}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      aria-hidden
    >
      <svg viewBox="0 0 320 160" className="w-full h-full">
        <defs>
          <linearGradient id="blobGrad" x1="0" x2="1">
            <stop offset="0" stopColor="#E8FBF7" />
            <stop offset="1" stopColor="#F1FFF8" />
          </linearGradient>
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="6" stdDeviation="12" floodColor="#89e7d0" floodOpacity="0.15" />
          </filter>
        </defs>

        <g filter="url(#shadow)">
          <path d="M30,40 C60,10 180,-10 260,40 C320,80 280,140 200,130 C120,120 80,80 30,100 Z" fill="url(#blobGrad)"/>
        </g>

        {/* little leaf */}
        <g transform="translate(240,20) rotate(12)">
          <ellipse cx="0" cy="0" rx="10" ry="18" fill="#C6F0E6" />
          <ellipse cx="-6" cy="2" rx="4" ry="8" fill="#9FE0C8" />
        </g>
      </svg>
    </motion.div>
  );
}
