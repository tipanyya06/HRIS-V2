import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../ui';

export default function Navbar() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-white shadow-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold text-blue-600">
          Madison 88
        </Link>

        <div className="hidden md:flex gap-6">
          <Link to="/" className="text-gray-700 hover:text-blue-600">Home</Link>
          <Link to="/careers" className="text-gray-700 hover:text-blue-600">Careers</Link>
          <Link to="/about-us" className="text-gray-700 hover:text-blue-600">About</Link>
          <Link to="/contact-us" className="text-gray-700 hover:text-blue-600">Contact</Link>
        </div>

        <div className="hidden md:flex gap-2 items-center">
          {user ? (
            <>
              <span className="text-sm text-gray-600 py-2">{user.email}</span>
              <Button onClick={handleLogout} variant="secondary" size="sm">
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button onClick={() => navigate('/login')} variant="ghost" size="sm">
                Login
              </Button>
              <Button onClick={() => navigate('/signup')} variant="primary" size="sm">
                Sign Up
              </Button>
            </>
          )}
        </div>

        <button
          className="md:hidden text-gray-600"
          onClick={() => setIsMobileOpen(!isMobileOpen)}
        >
          ☰
        </button>
      </div>

      {isMobileOpen ? (
        <div className="md:hidden bg-white border-t p-4 flex flex-col gap-3">
          <Link to="/" className="text-gray-700">Home</Link>
          <Link to="/careers" className="text-gray-700">Careers</Link>
          <Link to="/about-us" className="text-gray-700">About</Link>
          <Link to="/contact-us" className="text-gray-700">Contact</Link>
          {user ? (
            <Button onClick={handleLogout} variant="secondary" size="sm" className="w-full">
              Logout
            </Button>
          ) : (
            <>
              <Button onClick={() => navigate('/login')} variant="ghost" size="sm" className="w-full">
                Login
              </Button>
              <Button onClick={() => navigate('/signup')} variant="primary" size="sm" className="w-full">
                Sign Up
              </Button>
            </>
          )}
        </div>
      ) : null}
    </nav>
  );
}
