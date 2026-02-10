"use client";
import "../styles/globals.css";
import { Poppins, Playfair_Display, Quicksand, Inter } from "next/font/google";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { usePathname } from "next/navigation";

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

  // Hide Navbar and Footer on login/signup/dashboard pages
  const hideNavAndFooter = pathname === "/login" || pathname === "/signup" || pathname === "/dashboard";
  const fonts = `${poppins.className} ${quicksand.className} ${inter.className} ${playfair.className}`;

  return (
    <html
      lang="en"
      className={fonts}
    >
      <body className="bg-[#F8FAFC] text-gray-800 antialiased overflow-x-hidden">
        {!hideNavAndFooter && <Navbar />}
        <main className="min-h-screen">{children}</main>
        {!hideNavAndFooter && <Footer />}
      </body>
    </html>
  );
}
