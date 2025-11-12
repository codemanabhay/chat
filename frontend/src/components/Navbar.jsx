import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Button from './Button';
import { useAuth } from '../hooks/useAuth';

const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="sticky top-0 z-50 bg-gradient-to-r from-slate-950 via-purple-950 to-slate-950 border-b border-cyan-500/20 backdrop-blur"
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/" className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
          Chat App
        </Link>
        
        <div className="flex items-center gap-6">
          {user ? (
            <>
              <Link to="/dashboard" className="text-white hover:text-cyan-400 transition">
                Dashboard
              </Link>
              <Link to="/profile" className="text-white hover:text-cyan-400 transition">
                Profile
              </Link>
              <Button onClick={logout} variant="ghost" size="sm">
                Logout
              </Button>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button variant="secondary" size="sm">Login</Button>
              </Link>
              <Link to="/register">
                <Button variant="primary" size="sm">Register</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;
