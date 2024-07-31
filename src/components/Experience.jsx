import React, { useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Model } from './Model';
import * as THREE from 'three';

const Experience = () => {
  const globeRef = useRef();
  const [scrollPercent, setScrollPercent] = useState(0);

  const handleScroll = () => {
    const scrollY = document.querySelector('.App').scrollTop;
    const maxScroll = document.querySelector('.App').scrollHeight - window.innerHeight;
    const scrollFraction = scrollY / maxScroll;

    // Directly set  scroll fraction
    setScrollPercent(scrollFraction); 
  };

  useEffect(() => {
    const scrollContainer = document.querySelector('.App');
    scrollContainer.addEventListener('scroll', handleScroll);
    return () => scrollContainer.removeEventListener('scroll', handleScroll);
  }, []);

  useFrame(({ camera }) => {
    if (globeRef.current) {
      // centers model
      globeRef.current.position.set(0, 0, 0);
      globeRef.current.rotation.y = scrollPercent * Math.PI * 2;
    }

    camera.position.set(
      THREE.MathUtils.lerp(0, 10, scrollPercent),
      THREE.MathUtils.lerp(0, 5, scrollPercent),
      THREE.MathUtils.lerp(5, 20, scrollPercent)
    );
    camera.lookAt(0, 0, 0);
  });

  return (
    <group scale={3} ref={globeRef}>
      <Model scrollPercent={scrollPercent} />
    </group>

  );
};

export default Experience;
