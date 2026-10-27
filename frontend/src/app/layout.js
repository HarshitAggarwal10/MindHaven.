"use client";
import "../styles/globals.css";
import { useEffect } from "react";
import { Poppins, Playfair_Display, Quicksand, Inter } from "next/font/google";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { usePathname } from "next/navigation";
import { trackDashboardActivity } from "@/lib/activity-history";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const quicksand = Quicksand({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

// export const metadata = {
//   title: "MindHaven | Nurturing Mental Wellness",
//   description:
//     "MindHaven is your safe digital space for mental health support — where compassion meets technology.",
// };

export default function RootLayout({ children }) {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname === "/dashboard") {
      trackDashboardActivity("Opened the dashboard");
    } else if (pathname === "/") {
      trackDashboardActivity("Visited MindHaven home");
    } else if (pathname === "/about") {
      trackDashboardActivity("Explored MindHaven");
    } else if (pathname === "/contact") {
      trackDashboardActivity("Opened contact information");
    } else if (pathname === "/wellness") {
      trackDashboardActivity("Explored the Wellness Hub");
    } else if (pathname.startsWith("/wellness/")) {
      trackDashboardActivity("Viewed a retreat");
    } else if (pathname === "/community" || pathname.startsWith("/community/")) {
      trackDashboardActivity("Explored the community");
    }
  }, [pathname]);

  // The landing page owns the public navigation; app pages use focused layouts.
  const hideFooter =
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname === "/dashboard" ||
    pathname === "/community" ||
    pathname.startsWith("/community/");
  const fonts = `${poppins.className} ${quicksand.className} ${inter.className} ${playfair.className}`;

  return (
    <html
      lang="en"
      className={fonts}
    >
      <body className="bg-[#F8FAFC] text-gray-800 antialiased overflow-x-hidden">
        {["/", "/about", "/contact"].includes(pathname) && <Navbar />}
        <main className="min-h-screen">{children}</main>
        {!hideFooter && <Footer />}
      </body>
    </html>
  );
}
