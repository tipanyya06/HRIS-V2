import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer style={{ backgroundColor: '#162840' }} className="pt-16 pb-8 px-[6%]">
      <div className="max-w-[1100px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 pb-12 border-b border-white/[0.08]">
        <div>
          <div className="inline-block border border-white/30 px-3 py-1 rounded-sm mb-4 text-base font-bold text-white tracking-tight">
            madison<strong>88</strong>
          </div>
          <p className="text-[13.5px] leading-relaxed text-white/40 font-light max-w-[260px]">
            Building High-Quality, Best-In-Class Accessories. A global leader in outdoor headwear since 2003.
          </p>
        </div>

        <div>
          <h4 className="text-[10px] font-bold tracking-[0.18em] uppercase text-white/25 pb-3 mb-4 border-b border-white/[0.06]">
            Company
          </h4>
          <div className="flex flex-col gap-2.5">
            <Link to="/about-us" className="text-[13.5px] text-white/50 hover:text-white font-light no-underline transition-colors">
              About Us
            </Link>
            <Link to="/about-us" className="text-[13.5px] text-white/50 hover:text-white font-light no-underline transition-colors">
              Our History
            </Link>
            <Link to="/contact-us" className="text-[13.5px] text-white/50 hover:text-white font-light no-underline transition-colors">
              Contact Us
            </Link>
          </div>
        </div>

        <div>
          <h4 className="text-[10px] font-bold tracking-[0.18em] uppercase text-white/25 pb-3 mb-4 border-b border-white/[0.06]">
            Careers
          </h4>
          <div className="flex flex-col gap-2.5">
            <Link to="/careers" className="text-[13.5px] text-white/50 hover:text-white font-light no-underline transition-colors">
              Open Positions
            </Link>
            <Link to="/careers" className="text-[13.5px] text-white/50 hover:text-white font-light no-underline transition-colors">
              Apply Now
            </Link>
            <Link to="/login" className="text-[13.5px] text-white/50 hover:text-white font-light no-underline transition-colors">
              Sign In
            </Link>
          </div>
        </div>

        <div>
          <h4 className="text-[10px] font-bold tracking-[0.18em] uppercase text-white/25 pb-3 mb-4 border-b border-white/[0.06]">
            Legal
          </h4>
          <div className="flex flex-col gap-2.5">
            <Link to="/" className="text-[13.5px] text-white/50 hover:text-white font-light no-underline transition-colors">
              Privacy Policy
            </Link>
            <Link to="/" className="text-[13.5px] text-white/50 hover:text-white font-light no-underline transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-[1100px] mx-auto mt-6 flex justify-between items-center flex-wrap gap-2">
        <p className="text-xs text-white/20 font-light tracking-wide">
          © {new Date().getFullYear()} Madison 88 HRIS ATS. All rights reserved.
        </p>
        <p className="text-xs text-white/20 font-light tracking-wide">
          Denver, CO · New York City · Philippines · Indonesia
        </p>
      </div>
    </footer>
  );
}
