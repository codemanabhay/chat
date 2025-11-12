import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const [hoveredNav, setHoveredNav] = useState(null);

  const navItems = [
    { name: 'Home', path: '/', icon: '🎰' },
    { name: 'About', path: '/about', icon: '👋' },
    { name: 'Dashboard', path: '/dashboard', icon: '📊' },
    { name: 'Profile', path: '/profile', icon: '👤' },
    { name: 'Settings', path: '/settings', icon: '⚙️' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-50 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-cyan-500/20 shadow-2xl shadow-cyan-500/10"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex-shrink-0"
          >
            <Link
              to="/"
              className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent hover:from-cyan-300 hover:to-purple-400 transition-all"
            >
              📞 Chat Pro
            </Link>
          </motion.div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-center space-x-1">
              {navItems.map((item) => (
                <motion.div
                  key={item.path}
                  onHoverStart={() => setHoveredNav(item.path)}
                  onHoverEnd={() => setHoveredNav(null)}
                  className="relative"
                >
                  <Link
                    to={item.path}
                    className={`px-4 py-2 rounded-lg font-semibold transition-all duration-300 flex items-center gap-2 ${
                      isActive(item.path)
                        ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white shadow-lg shadow-cyan-500/50'
                        : 'text-gray-300 hover:text-white'
                    }`}
                  >
                    <span className="text-lg">{item.icon}</span>
                    <span>{item.name}</span>
                  </Link>
                  {isActive(item.path) && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 rounded-lg -z-10"
                      initial={false}
                    />
                  )}
                </motion.div>
              ))}
            </div>
          </div>

          {/* Auth Section */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-800 border border-cyan-500/30 hover:border-cyan-500/60 transition-all cursor-pointer"
                >
                  <span className="text-lg">👤</span>
                  <span className="text-sm text-gray-300">{user.name || 'User'}</span>
                </motion.div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={logout}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-semibold transition-all hover:shadow-lg hover:shadow-red-500/50"
                >
                  Logout
                </motion.button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-lg text-cyan-400 hover:text-cyan-300 font-semibold border border-cyan-500/50 hover:border-cyan-500 transition-all hover:shadow-lg hover:shadow-cyan-500/20"
                >
                  Login
                </Link>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link
                    to="/register"
                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold transition-all hover:shadow-lg hover:shadow-cyan-500/50"
                  >
                    Sign Up
                  </Link>
                </motion.div>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-cyan-400 hover:text-cyan-300 hover:bg-gray-800/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
          >
            <span className="text-2xl">{isOpen ? '✕' : '☰'}</span>
          </motion.button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <motion.div
        initial={false}
        animate={isOpen ? 'open' : 'closed'}
        variants={{
          open: { height: 'auto', opacity: 1 },
          closed: { height: 0, opacity: 0 },
        }}
        className="md:hidden overflow-hidden bg-gradient-to-b from-slate-800 to-slate-900 border-t border-cyan-500/10"
      >
        <div className="px-2 pt-2 pb-3 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`block px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                isActive(item.path)
                  ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white'
                  : 'text-gray-300 hover:text-white hover:bg-gray-800/50'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.name}</span>
            </Link>
          ))}
          <div className="px-2 pt-2 space-y-2">
            {user ? (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={logout}
                className="w-full px-4 py-2 rounded-lg bg-gradient-to-r from-red-500 to-pink-500 text-white font-semibold transition-all hover:shadow-lg"
              >
                Logout
              </motion.button>
            ) : (
              <>
                <Link
                  to="/login"
                  className="block px-4 py-2 rounded-lg text-cyan-400 border border-cyan-500/50 text-center font-semibold hover:bg-gray-800/50 transition-all"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="block px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold text-center transition-all hover:shadow-lg"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </motion.div>
    </motion.nav>
  );
};

export default Navbar;
