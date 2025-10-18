import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function Footer() {
  const [visible, setVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  // Detect scroll for mobile
  useEffect(() => {
    const handleScroll = () => {
      if (!isMobile) return; // Desktop: do not auto-hide

      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setVisible(false); // hide on scroll down
      } else {
        setVisible(true); // show on scroll up
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY, isMobile]);

  // Detect screen size changes (for responsiveness)
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <motion.footer
      className="fixed bottom-0 left-0 w-full bg-gray-900 text-gray-300 py-4 shadow-lg z-50 flex flex-col items-center justify-center text-center"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : 60 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
    >
      <p className="text-sm mb-2">
        © {new Date().getFullYear()} Transport Management Portal. All rights reserved.
      </p>
      <div className="flex space-x-6 text-sm">
        <a href="#" className="hover:text-white transition duration-300">
          Privacy Policy
        </a>
        <a href="#" className="hover:text-white transition duration-300">
          Terms of Service
        </a>
        <a
          href="mailto:contact@transportportal.com"
          className="hover:text-white transition duration-300"
        >
          Contact
        </a>
      </div>
    </motion.footer>
  );
}
