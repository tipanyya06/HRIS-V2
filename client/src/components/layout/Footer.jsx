import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white mt-12">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="font-bold text-lg mb-2">Madison 88</h3>
            <p className="text-gray-400 text-sm">Building High-Quality, Best-In-Class Accessories</p>
          </div>
          <div>
            <h4 className="font-bold mb-2">Company</h4>
            <Link to="/about-us" className="text-gray-400 hover:text-white text-sm block">About Us</Link>
            <Link to="/careers" className="text-gray-400 hover:text-white text-sm block">Careers</Link>
            <Link to="/contact-us" className="text-gray-400 hover:text-white text-sm block">Contact</Link>
          </div>
        </div>
        <div className="border-t border-gray-700 pt-4 text-center text-gray-400 text-sm">
          Copyright 2024 Madison 88. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
