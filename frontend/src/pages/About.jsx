import React from 'react';
import { motion } from 'framer-motion';

const About = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-20 px-4">
      <div className="max-w-4xl mx-auto">
        <motion.h1 className="text-5xl font-bold text-center bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-12"
          initial={{opacity:0}} animate={{opacity:1}} transition={{duration:0.8}}>
          About This Application
        </motion.h1>
        
        <motion.div className="space-y-8 text-gray-300"
          initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.2}}>
          <section className="bg-slate-800/30 p-8 rounded-lg border border-cyan-500/20 backdrop-blur">
            <h2 className="text-2xl font-bold text-cyan-400 mb-4">Creator: Abhay (codemanabhay)</h2>
            <p className="leading-relaxed">This real-time chat application was created with a passion for modern web development and cutting-edge UI/UX design. The project showcases advanced React patterns, real-time communication via Socket.io, and stunning 3D animations.</p>
          </section>

          <section className="bg-slate-800/30 p-8 rounded-lg border border-cyan-500/20 backdrop-blur">
            <h2 className="text-2xl font-bold text-cyan-400 mb-4">Features</h2>
            <ul className="space-y-2"><li>✨ Real-time messaging with Socket.io</li>
              <li>🎨 Beautiful 3D animations and transitions</li>
              <li>🔒 Secure authentication</li>
              <li>📱 Fully responsive design</li>
              <li>🌙 Dark theme with modern UI</li></ul>
          </section>

          <section className="bg-slate-800/30 p-8 rounded-lg border border-cyan-500/20 backdrop-blur">
            <h2 className="text-2xl font-bold text-cyan-400 mb-4">Technology Stack</h2>
            <p>React, Tailwind CSS, Framer Motion, Socket.io, Express.js, MongoDB</p>
          </section>
        </motion.div>
      </div>
    </div>
  );
};

export default About;
