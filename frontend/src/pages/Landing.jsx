import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import Button from '../components/Button';

const Landing = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center px-4">
      <div className="max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-6xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-6">
            Real-Time Chat Application
          </h1>
          <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto">
            Experience seamless real-time messaging with stunning 3D animations and modern UI design. Connect with anyone, anywhere, anytime.
          </p>
          <div className="flex gap-6 justify-center">
            <Link to="/register">
              <Button variant="primary" size="lg">Get Started</Button>
            </Link>
            <Link to="/about">
              <Button variant="ghost" size="lg">Learn More</Button>
            </Link>
          </div>
        </motion.div>

        <motion.div
          className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {[{ icon: '⚡', title: 'Fast', desc: 'Lightning-fast real-time messaging' },
            { icon: '🔒', title: 'Secure', desc: 'End-to-end encryption' },
            { icon: '✨', title: 'Beautiful', desc: '3D animations and modern UI' }
          ].map((item, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -10 }}
              className="p-6 bg-slate-800/50 border border-cyan-500/30 rounded-lg backdrop-blur"
            >
              <div className="text-4xl mb-4">{item.icon}</div>
              <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
              <p className="text-gray-400">{item.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default Landing;
