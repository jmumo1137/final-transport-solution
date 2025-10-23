// src/pages/TransportPortalLanding.jsx
import React from "react";
import { motion } from "framer-motion";

/* -------------------------
  Transport Portal Logo
------------------------- */
function Logo({ className = "h-8 w-auto" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 240 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Transport Portal logo"
    >
      <defs>
        <linearGradient id="portalGradient" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#1e3a8a" />
          <stop offset="1" stopColor="#06b6d4" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="240" height="40" rx="20" fill="url(#portalGradient)" />
      <text
        x="44"
        y="26"
        fontFamily="Inter, system-ui"
        fontWeight="700"
        fontSize="20"
        fill="#ffffff"
      >
        Transport Portal
      </text>
    </svg>
  );
}

/* -------------------------
  Animations
------------------------- */
const fadeUp = { hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0 } };

/* -------------------------
  Optimized Image Component
------------------------- */
function OptimizedImage({ alt, src, className, width, height }) {
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      width={width}
      height={height}
      className={className}
      style={{ objectFit: "cover", width: "100%", height: "auto" }}
    />
  );
}

/* -------------------------
  Main Landing Component
------------------------- */
export default function TransportPortalLanding() {
  return (
    <div className="min-h-screen font-sans text-slate-900 bg-white">
      {/* Header */}
      <header className="w-full border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo className="h-8 w-auto" />
            <span className="text-lg font-semibold tracking-tight text-slate-800">
              Transport Portal
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm">
            <a href="#features" className="hover:text-cyan-600">
              Modules
            </a>
            <a href="#benefits" className="hover:text-cyan-600">
              Why Us
            </a>
            <a
              href="/register"
              className="inline-flex items-center justify-center gap-2 px-5 py-2 rounded-full bg-[#1e3a8a] text-white font-semibold shadow-md transition-transform transform hover:scale-105 hover:bg-gradient-to-r hover:from-[#1e3a8a] hover:to-[#06b6d4]"
            >
              <span className="w-2.5 h-2.5 bg-white rounded-full"></span>
              Register
            </a>
          </nav>

          <div className="md:hidden">
            <button aria-label="Menu" className="p-2 text-slate-700">
              ☰
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 flex justify-center items-center opacity-10 -z-10">
          <img
            src="/images/hero-truck.jpg"
            alt="Transport Background"
            className="w-full max-w-[900px] h-auto object-contain"
          />
        </div>

        <div className="max-w-7xl mx-auto px-6 py-20 lg:py-28">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <motion.div
              initial="hidden"
              animate="show"
              variants={fadeUp}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight text-[#1e3a8a] drop-shadow-md">
                Streamline Your Transport Operations
              </h1>
              <p className="mt-6 max-w-xl text-lg text-slate-700">
                Manage orders, drivers, fuel, and payments all in one smart platform designed for
                transport businesses of every size.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <a
                  href="/register"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-[#1e3a8a] text-white font-semibold shadow-md hover:scale-105 transition-transform hover:bg-gradient-to-r hover:from-[#1e3a8a] hover:to-[#06b6d4]"
                >
                  <span className="w-3 h-3 bg-white rounded-full"></span>
                  Get Started
                </a>

                <a
                  href="#features"
                  className="inline-flex items-center justify-center px-6 py-3 rounded-full border border-slate-300 text-sm text-slate-700 hover:bg-slate-50"
                >
                  Explore Modules
                </a>
              </div>
            </motion.div>

            {/* Dashboard mockup */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="relative"
            >
              <div className="rounded-2xl overflow-hidden shadow-2xl bg-white ring-1 ring-slate-100">
                <div className="p-6">
                  <h3 className="text-xl font-semibold">Smart Dashboard</h3>
                  <p className="mt-2 text-sm text-slate-600">
                    Real-time insights, trip monitoring, and cost analytics.
                  </p>

                  <div className="mt-4 h-48 rounded-md border border-slate-100 overflow-hidden">
                    <OptimizedImage
                      alt="dashboard screenshot"
                      src="/images/dashboard-hero.png"
                      width={640}
                      height={320}
                      className="w-full h-48 object-cover"
                    />
                  </div>
                </div>
              </div>
              <div className="hidden lg:block absolute -right-16 -bottom-10 w-56 h-56 bg-gradient-to-br from-cyan-200 to-indigo-200 rounded-full opacity-60 blur-3xl" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Modules Section */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center">
          <motion.h2
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={fadeUp}
            transition={{ duration: 0.5 }}
            className="text-3xl font-extrabold text-[#1e3a8a]"
          >
            Transport Portal Modules
          </motion.h2>
          <motion.p
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={fadeUp}
            transition={{ duration: 0.6 }}
            className="mt-3 text-slate-600 max-w-2xl mx-auto"
          >
            Every module works together — from orders to payments — for seamless operations and
            visibility.
          </motion.p>
        </div>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={{ show: { transition: { staggerChildren: 0.06 } } }}
          className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {[
            { title: "Orders", desc: "Manage and assign shipments instantly." },
            { title: "Fuel Logs", desc: "Track fuel receipts, liters, and costs." },
            { title: "Mileage", desc: "Monitor odometer entries and performance." },
            { title: "Documents", desc: "Upload PODs and essential transport files." },
            { title: "Payments", desc: "Automate invoicing and track settlements." },
            { title: "Analytics", desc: "Visualize performance and driver efficiency." },
          ].map((f) => (
            <motion.article
              key={f.title}
              variants={fadeUp}
              className="p-6 bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition"
            >
              <h3 className="text-lg font-semibold text-[#1e3a8a]">{f.title}</h3>
              <p className="mt-3 text-sm text-slate-600">{f.desc}</p>
            </motion.article>
          ))}
        </motion.div>
      </section>

      {/* Benefits */}
      <section id="benefits" className="bg-[#f0f6ff]">
        <div className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div>
            <h3 className="text-2xl font-extrabold text-[#1e3a8a]">
              Why Businesses Choose Transport Portal
            </h3>
            <ul className="mt-6 space-y-4 text-slate-700">
              <li>✅ End-to-end shipment visibility</li>
              <li>✅ Automated workflows & alerts</li>
              <li>✅ Plug-and-play API integrations</li>
              <li>✅ Real-time cost & performance analytics</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#1e3a8a] text-white">
        <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <Logo className="h-7 w-auto" />
            <span className="font-semibold">Transport Portal © {new Date().getFullYear()}</span>
          </div>
          <div className="flex gap-6 text-sm">
            <a href="#" className="hover:underline">
              Privacy
            </a>
            <a href="#" className="hover:underline">
              Terms
            </a>
            <a href="#" className="hover:underline">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
