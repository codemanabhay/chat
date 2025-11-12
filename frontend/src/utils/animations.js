import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import * as THREE from 'three';

gsap.registerPlugin(ScrollTrigger);

// GSAP Animation Presets
export const gsapAnimations = {
  // Fade In Effect
  fadeIn: (element, duration = 0.8) => {
    return gsap.fromTo(
      element,
      { opacity: 0 },
      { opacity: 1, duration }
    );
  },

  // Slide In From Left
  slideInLeft: (element, duration = 0.8) => {
    return gsap.fromTo(
      element,
      { x: -100, opacity: 0 },
      { x: 0, opacity: 1, duration, ease: 'power3.out' }
    );
  },

  // Slide In From Right
  slideInRight: (element, duration = 0.8) => {
    return gsap.fromTo(
      element,
      { x: 100, opacity: 0 },
      { x: 0, opacity: 1, duration, ease: 'power3.out' }
    );
  },

  // Slide In From Top
  slideInTop: (element, duration = 0.8) => {
    return gsap.fromTo(
      element,
      { y: -100, opacity: 0 },
      { y: 0, opacity: 1, duration, ease: 'power3.out' }
    );
  },

  // Slide In From Bottom
  slideInBottom: (element, duration = 0.8) => {
    return gsap.fromTo(
      element,
      { y: 100, opacity: 0 },
      { y: 0, opacity: 1, duration, ease: 'power3.out' }
    );
  },

  // Scale Up
  scaleUp: (element, duration = 0.6) => {
    return gsap.fromTo(
      element,
      { scale: 0.8, opacity: 0 },
      { scale: 1, opacity: 1, duration, ease: 'back.out' }
    );
  },

  // Rotate Entrance
  rotateIn: (element, duration = 0.8) => {
    return gsap.fromTo(
      element,
      { rotation: -360, opacity: 0 },
      { rotation: 0, opacity: 1, duration, ease: 'power2.out' }
    );
  },

  // Flip Animation
  flip: (element, duration = 0.6) => {
    return gsap.to(element, {
      rotationY: 360,
      duration,
      ease: 'back.out'
    });
  },

  // Bounce Effect
  bounce: (element, duration = 0.8) => {
    return gsap.to(element, {
      y: -20,
      duration: duration / 2,
      repeat: 1,
      yoyo: true,
      ease: 'power1.inOut'
    });
  },

  // Text Typing Effect
  typeText: (element, text, duration = 0.05) => {
    let index = 0;
    element.textContent = '';
    
    const type = () => {
      if (index < text.length) {
        element.textContent += text[index];
        index++;
        setTimeout(type, duration * 1000);
      }
    };
    type();
  },

  // Parallax Scroll
  parallax: (element, speed = 0.5) => {
    gsap.set(element, { y: 0 });
    ScrollTrigger.create({
      onUpdate: (self) => {
        gsap.to(element, {
          y: self.getVelocity() * speed,
          overwrite: 'auto'
        });
      }
    });
  },

  // Glow Effect
  glowEffect: (element, duration = 2) => {
    return gsap.to(element, {
      textShadow: '0 0 10px rgba(255, 255, 255, 0.8)',
      repeat: -1,
      yoyo: true,
      duration
    });
  }
};

// Framer Motion Variants
export const framerMotionVariants = {
  pageVariants: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.5 } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.3 } }
  },

  containerVariants: {
    initial: { opacity: 0 },
    animate: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  },

  itemVariants: {
    initial: { opacity: 0, y: 20 },
    animate: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring', stiffness: 100 }
    }
  },

  cardVariants: {
    initial: { scale: 0.8, opacity: 0 },
    animate: {
      scale: 1,
      opacity: 1,
      transition: { type: 'spring', stiffness: 50, damping: 15 }
    },
    hover: { scale: 1.05, transition: { type: 'spring', stiffness: 400 } }
  },

  textVariants: {
    initial: { opacity: 0 },
    animate: {
      opacity: 1,
      transition: { staggerChildren: 0.05, delayChildren: 0.1 }
    }
  },

  charVariants: {
    initial: { opacity: 0, y: 50 },
    animate: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring', stiffness: 100, damping: 12 }
    }
  },

  buttonVariants: {
    initial: { scale: 1 },
    hover: { scale: 1.1, boxShadow: '0 0 20px rgba(100, 200, 255, 0.5)' },
    tap: { scale: 0.95 }
  },

  sidebarVariants: {
    initial: { x: -300, opacity: 0 },
    animate: { x: 0, opacity: 1, transition: { type: 'spring', stiffness: 100 } },
    exit: { x: -300, opacity: 0, transition: { duration: 0.2 } }
  },

  modalVariants: {
    initial: { opacity: 0, scale: 0.5 },
    animate: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 100 } },
    exit: { opacity: 0, scale: 0.5, transition: { duration: 0.2 } }
  },

  backgroundVariants: {
    initial: { opacity: 0 },
    animate: {
      opacity: 1,
      transition: { duration: 1 },
      backgroundPosition: ['0% 0%', '100% 100%']
    }
  }
};

// Three.js Helpers
export const threeJsHelpers = {
  // Create rotating cube
  createRotatingCube: (scene, size = 1, color = 0x00ff00) => {
    const geometry = new THREE.BoxGeometry(size, size, size);
    const material = new THREE.MeshPhongMaterial({ color });
    const cube = new THREE.Mesh(geometry, material);
    
    const animateCube = () => {
      cube.rotation.x += 0.01;
      cube.rotation.y += 0.01;
      requestAnimationFrame(animateCube);
    };
    
    scene.add(cube);
    animateCube();
    return cube;
  },

  // Create floating particles
  createParticles: (scene, count = 100) => {
    const particles = [];
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);

    for (let i = 0; i < count * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 200;
      positions[i + 1] = (Math.random() - 0.5) * 200;
      positions[i + 2] = (Math.random() - 0.5) * 200;

      velocities[i] = (Math.random() - 0.5) * 0.5;
      velocities[i + 1] = (Math.random() - 0.5) * 0.5;
      velocities[i + 2] = (Math.random() - 0.5) * 0.5;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({ color: 0x00ffff, size: 1 });
    const particleSystem = new THREE.Points(geometry, material);

    scene.add(particleSystem);
    return { particleSystem, velocities };
  },

  // Camera orbit animation
  orbitCamera: (camera, radius = 50, speed = 0.001) => {
    let angle = 0;
    
    const orbit = () => {
      angle += speed;
      camera.position.x = Math.cos(angle) * radius;
      camera.position.z = Math.sin(angle) * radius;
      camera.lookAt(0, 0, 0);
      requestAnimationFrame(orbit);
    };
    
    orbit();
  }
};

// Scroll Trigger Animations
export const scrollAnimations = {
  fadeOnScroll: (elements) => {
    elements.forEach((element) => {
      gsap.fromTo(
        element,
        { opacity: 0, y: 50 },
        {
          opacity: 1,
          y: 0,
          scrollTrigger: {
            trigger: element,
            start: 'top 80%',
            end: 'top 20%',
            scrub: 1,
            markers: false
          }
        }
      );
    });
  },

  scaleOnScroll: (elements) => {
    elements.forEach((element) => {
      gsap.fromTo(
        element,
        { scale: 0.5 },
        {
          scale: 1,
          scrollTrigger: {
            trigger: element,
            start: 'top 75%',
            scrub: 0.5
          }
        }
      );
    });
  },

  rotateOnScroll: (elements) => {
    elements.forEach((element) => {
      gsap.to(element, {
        rotation: 360,
        scrollTrigger: {
          trigger: element,
          start: 'top center',
          end: 'bottom center',
          scrub: 1,
          markers: false
        }
      });
    });
  }
};

// Text Animation Helpers
export const textAnimations = {
  splitWords: (text) => {
    return text.split(' ').map(word => `<span>${word}</span>`).join(' ');
  },

  splitChars: (text) => {
    return text.split('').map(char => `<span>${char}</span>`).join('');
  },

  animateWords: (element, duration = 0.5) => {
    const words = element.querySelectorAll('span');
    return gsap.fromTo(
      words,
      { opacity: 0, y: 20 },
      {
        opacity: 1,
        y: 0,
        duration,
        stagger: 0.1
      }
    );
  },

  animateChars: (element, duration = 0.05) => {
    const chars = element.querySelectorAll('span');
    return gsap.fromTo(
      chars,
      { opacity: 0, y: 50 },
      {
        opacity: 1,
        y: 0,
        duration,
        stagger: 0.05
      }
    );
  }
};

export default {
  gsapAnimations,
  framerMotionVariants,
  threeJsHelpers,
  scrollAnimations,
  textAnimations
};
