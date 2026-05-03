"use client";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { usePathname } from 'next/navigation';

export default function AppShell({ children }) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith('/admin');
  
  return (
    <>
      {/* {!isAdminRoute && <Navbar />} */}
      <main className={isAdminRoute ? "" : ""}>
        {children}
      </main>
      {!isAdminRoute && <Footer />}
    </>
  );
}
