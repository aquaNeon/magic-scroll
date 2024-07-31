import React, { useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import Experience from './components/Experience';
import './index.css';

function App() {
  const scrollContainerRef = useRef(null);

  const handleScroll = () => {
    const scrollY = scrollContainerRef.current.scrollTop;
  };

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    scrollContainer.addEventListener('scroll', handleScroll);
    return () => scrollContainer.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="App" ref={scrollContainerRef}>
      <div className="sticky-canvas">
        <Canvas>
          <Experience />
          <ambientLight intensity={2} />
        </Canvas>
      </div>
      <div className="content">
        <div className="text-section"></div>
        <div className="text-section"></div>
        <div className="text-section"></div>
        <div className="text-section">MAGIC</div>
      </div>
    </div>
  );
}

export default App;

