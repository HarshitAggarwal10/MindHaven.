// src/components/FloatingDecor.js
"use client";

import { Canvas } from "@react-three/fiber";
import { Float, OrbitControls, Environment } from "@react-three/drei";
import { motion } from "framer-motion";
import Image from "next/image";
import dashboard from "../public/landingpage/dashboard.png";


/*
Lightweight floating 3D shapes plus a soft background image accent.
Place the image at: public/landingpage/dashboard-bg.png
*/

export default function FloatingDecor() {
  return (
    <>
      {/* soft radial blobs behind everything */}
      <div className="absolute inset-0 -z-20 pointer-events-none">
        <div className="absolute -top-48 -left-48 w-[640px] h-[640px] rounded-full blur-3xl opacity-40"
             style={{ background: "radial-gradient(circle at 30% 30%, #BEECE3, transparent 30%)" }} />
        <div className="absolute -bottom-40 -right-40 w-[720px] h-[720px] rounded-full blur-3xl opacity-35"
             style={{ background: "radial-gradient(circle at 70% 70%, #DDEFF6, transparent 30%)" }} />
      </div>

      {/* faded decorative image to the right (optional) */}
      <motion.div
        className="absolute right-10 top-12 -z-10 opacity-30 hidden md:block pointer-events-none"
        animate={{ y: [0, -8, 0], rotate: [0, 1.5, -1.5, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      >
        <Image
          src={dashboard}
          alt="decor"
          width={520}
          height={520}
          className="rounded-2xl object-cover select-none"
          priority
        />
      </motion.div>

      {/* 3D canvas with soft pastel shapes */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <Canvas camera={{ position: [0, 0, 6], fov: 50 }}>
          <ambientLight intensity={0.8} />
          <directionalLight position={[5, 5, 5]} intensity={0.6} />
          <directionalLight position={[-5, -5, -5]} intensity={0.25} />

          <Float speed={1.0} rotationIntensity={0.25} floatIntensity={0.9}>
            <mesh position={[-1.6, 1.0, 0]}>
              <icosahedronGeometry args={[0.9, 0]} />
              <meshStandardMaterial color="#A3F0DE" metalness={0.25} roughness={0.6} transparent opacity={0.95} />
            </mesh>
          </Float>

          <Float speed={0.9} rotationIntensity={0.45} floatIntensity={0.8}>
            <mesh position={[1.6, -0.5, 0]}>
              <torusKnotGeometry args={[0.5, 0.15, 128, 32]} />
              <meshStandardMaterial color="#CBE7FF" metalness={0.25} roughness={0.4} transparent opacity={0.96} />
            </mesh>
          </Float>

          <Float speed={1.2} rotationIntensity={0.6} floatIntensity={0.6}>
            <mesh position={[0.5, 0.8, -0.3]}>
              <sphereGeometry args={[0.35, 32, 32]} />
              <meshStandardMaterial color="#FFF1E0" metalness={0.15} roughness={0.45} transparent opacity={0.95} />
            </mesh>
          </Float>

          <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.08} />
          <Environment preset="sunset" />
        </Canvas>
      </div>
    </>
  );
}
