import React, { useRef, useEffect, useMemo, useState } from 'react';
import { Canvas, extend, useFrame, useThree } from '@react-three/fiber';
import { useGLTF, useAnimations, Environment, Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';

extend({ EffectComposer, RenderPass, UnrealBloomPass });

function BloomEffect() {
  const { gl, scene, camera, size } = useThree();
  const composer = useRef();

  useEffect(() => {
    composer.current = new EffectComposer(gl);
    const renderPass = new RenderPass(scene, camera);
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(size.width, size.height), 1.0, 0.4, 0.85);
    composer.current.addPass(renderPass);
    composer.current.addPass(bloomPass);
  }, [gl, scene, camera, size]);

  useFrame(() => composer.current && composer.current.render(), 1);
  return null;
}

function MagicEffect({ position, show, key }) {
  const points = useRef();
  const [velocities, setVelocities] = useState([]);
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    if (show) {
      setOpacity(1);
      // Initialize velocities for the particles
      const newVelocities = [];
      for (let i = 0; i < 20; i++) {
        newVelocities.push([
          (Math.random() - 0.5) * 1.5, // x velocity
          (Math.random() - 0.5) * 1.5, // y velocity
          (Math.random() - 0.5) * 1.5, // z velocity
        ]);
      }
      setVelocities(newVelocities);

      // Fade out effect
      const fadeOutInterval = setInterval(() => {
        setOpacity((prev) => Math.max(prev - 0.05, 0));
      }, 15);

      // Stop showing after 1 second
      setTimeout(() => {
        clearInterval(fadeOutInterval);
        // setShow(false);
      }, 1000);
    }
  }, [show, key]);

  useFrame((state, delta) => {
    if (points.current) {
      const positions = points.current.geometry.attributes.position.array;
      for (let i = 0; i < positions.length; i += 3) {
        positions[i] += velocities[i / 3][0] * delta;
        positions[i + 1] += velocities[i / 3][1] * delta;
        positions[i + 2] += velocities[i / 3][2] * delta;
      }
      points.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  const particlePositions = useMemo(() => {
    const positions = [];
    for (let i = 0; i < 10; i++) {
      positions.push((Math.random() - 0.5) * 0.5);
      positions.push((Math.random() - 0.5) * 0.5);
      positions.push((Math.random() - 0.5) * 0.5);
    }
    return new Float32Array(positions);
  }, [key]);

  return (
    show && (
      <Points ref={points} positions={particlePositions} position={position}>
        <PointMaterial transparent color="#fffff0" size={0.05} sizeAttenuation depthWrite={false} opacity={opacity} />
      </Points>
    )
  );
}

export function Model(props) {
  const group = useRef();
  const { nodes, materials, animations } = useGLTF('/assets/caludron.glb');
  const { actions } = useAnimations(animations, group);
  const [potionColor, setPotionColor] = useState(new THREE.Color(0x00ff00)); // Initial Potion color
  const [emissiveIntensity, setEmissiveIntensity] = useState(1); // Initial emissive intensity
  const [visibleItems, setVisibleItems] = useState({
    EYE: true,
    FEATHER: true,
    SHROOM: true,
    FANG: true,
    ROSE: true,
    POTION: true,
  });

  const [effectPosition, setEffectPosition] = useState([0, 0, 0]);
  const [showEffect, setShowEffect] = useState(false);
  const [effectKey, setEffectKey] = useState(0);

  // Create a base material for the Potion
  const potionMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    color: potionColor,
    emissive: potionColor,
    emissiveIntensity: emissiveIntensity,
  }), [potionColor, emissiveIntensity]);

  // Update Potion and its children's material when the potionColor or emissiveIntensity changes
  useEffect(() => {
    if (nodes.Potion) {
      nodes.Potion.material = potionMaterial;
      nodes.BUB1.material = potionMaterial;
      nodes.BUB2.material = potionMaterial;
      nodes.BUB3.material = potionMaterial;
      nodes.BUB4.material = potionMaterial;
      nodes.BUB5.material = potionMaterial;
    }
  }, [potionColor, emissiveIntensity, nodes, potionMaterial]);

  useEffect(() => {
    if (actions) {
      Object.values(actions).forEach(action => {
        action.setLoop(THREE.LoopRepeat, Infinity); // Ensure animations loop infinitely
        action.clampWhenFinished = false; // Don't clamp the last frame when the animation finishes
        action.setEffectiveTimeScale(0.5); // Set animation speed to half
        action.play();
      });
    }
  }, [actions]);

  // Handle item click
  const handleItemClick = (itemName, position) => {
    // Change the emissive intensity
    setEmissiveIntensity((prevIntensity) => prevIntensity + 0.5); // Increase emissive intensity

    // Hide the clicked item
    setVisibleItems(prevState => ({ ...prevState, [itemName]: false }));

    // Check if it's the last item
    const remainingItems = Object.values(visibleItems).filter(Boolean).length;
    if (remainingItems === 1) {
      setPotionColor(new THREE.Color(Math.random() * 0xffffff));
      PointMaterial.emissiveIntensity = 10;

    }

    // Set the effect position and show the effect
    setEffectPosition(position.toArray());
    setEffectKey(prevKey => prevKey + 1); // Update the effect key to trigger reinitialization
    setShowEffect(true); 

  };

  // Handle pointer over event to change cursor
  const handlePointerOver = (e) => {
    document.body.style.cursor = 'pointer';
  };

  // Handle pointer out event to reset cursor
  const handlePointerOut = (e) => {
    document.body.style.cursor = 'auto';
  };

  return (
    <>
      <Environment preset="sunset" />
      <BloomEffect />
      <group ref={group} {...props} dispose={null}>
        <group name="MAGIC">
          {visibleItems.PATH_FANG && (
            <group name="PATH_FANG" position={[0.031, -0.212, -0.045]} rotation={[0.468, -0.273, -0.066]} scale={[1.212, 1.226, 1.323]} />
          )}
          {visibleItems.PATH_EYE && (
            <group name="PATH_EYE" position={[0, -0.076, -0.186]} rotation={[-1.957, 0.442, -Math.PI]} scale={1.307} />
          )}
          {visibleItems.PATH_POTION && (
            <group name="PATH_POTION" rotation={[1.508, 0.153, -1.18]} scale={1.296} />
          )}
          {visibleItems.PATH_SHROOM && (
            <group name="PATH_SHROOM" position={[0.031, -0.192, -0.03]} rotation={[-1.773, 1.036, 1.746]} scale={1.136} />
          )}
          {visibleItems.PATH_FEATHER && (
            <group name="PATH_FEATHER" position={[-0.084, -0.101, 0]} rotation={[-0.547, -0.24, -0.749]} scale={1.231} />
          )}
          {visibleItems.PATH_ROSE && (
            <group name="PATH_ROSE" position={[0, 0.111, 0]} rotation={[-2.951, -0.099, -3.122]} scale={1.421} />
          )}
          <mesh name="CALUDRON" geometry={nodes.CALUDRON.geometry} material={materials.Gold}>
            <mesh name="Potion" geometry={nodes.Potion.geometry} material={potionMaterial}>
              <mesh name="BUB1" geometry={nodes.BUB1.geometry} material={potionMaterial} position={[-0.183, 0.72, 0.066]} scale={0.049} />
              <mesh name="BUB2" geometry={nodes.BUB2.geometry} material={potionMaterial} position={[-0.195, 0.575, 0.196]} rotation={[0, -1.474, 0]} scale={0.041} />
              <mesh name="BUB3" geometry={nodes.BUB3.geometry} material={potionMaterial} position={[0.149, 0.541, 0.384]} scale={0.023} />
              <mesh name="BUB4" geometry={nodes.BUB4.geometry} material={potionMaterial} position={[-0.152, 0.441, -0.398]} scale={0.041} />
              <mesh name="BUB5" geometry={nodes.BUB5.geometry} material={potionMaterial} position={[0.051, 0.442, -0.029]} scale={0.079} />
            </mesh>
          </mesh>
          {visibleItems.ROSE && (
            <mesh
              name="ROSE"
              geometry={nodes.ROSE.geometry}
              material={materials.chinese_rose_mat}
              position={[-0.14, 0.378, -1.388]}
              rotation={[-2.951, -0.099, -3.122]}
              scale={1.25}
              onClick={(e) => handleItemClick('ROSE', e.object.position)}
              onPointerOver={handlePointerOver}
              onPointerOut={handlePointerOut}
            />
          )}
          {visibleItems.FANG && (
            <mesh
              name="FANG"
              geometry={nodes.FANG.geometry}
              material={materials.lambert2}
              position={[-0.325, -0.787, 1.093]}
              rotation={[0.468, -0.273, -0.066]}
              onClick={(e) => handleItemClick('FANG', e.object.position)}
              onPointerOver={handlePointerOver}
              onPointerOut={handlePointerOut}
            />
          )}
          {visibleItems.SHROOM && (
            <mesh
              name="SHROOM"
              geometry={nodes.SHROOM.geometry}
              material={materials['default']}
              position={[1.008, 0.448, -0.146]}
              rotation={[-1.773, 1.036, 1.746]}
              onClick={(e) => handleItemClick('SHROOM', e.object.position)}
              onPointerOver={handlePointerOver}
              onPointerOut={handlePointerOut}
            />
          )}
          {visibleItems.EYE && (
            <mesh
              name="EYE"
              geometry={nodes.EYE.geometry}
              material={materials.PM3D_Sphere3D_1}
              position={[0.559, 1.019, -0.631]}
              rotation={[-1.957, 0.442, -Math.PI]}
              onClick={(e) => handleItemClick('EYE', e.object.position)}
              onPointerOver={handlePointerOver}
              onPointerOut={handlePointerOut}
            />
          )}
          {visibleItems.FEATHER && (
            <mesh
              name="FEATHER"
              geometry={nodes.FEATHER.geometry}
              material={materials.Material}
              position={[-0.377, 0.52, 1.022]}
              rotation={[-0.547, -0.24, -0.749]}
              onClick={(e) => handleItemClick('FEATHER', e.object.position)}
              onPointerOver={handlePointerOver}
              onPointerOut={handlePointerOut}
            />
          )}
          {visibleItems.POTION && (
            <mesh
              name="POTION"
              geometry={nodes.POTION.geometry}
              material={materials.Potion_mat}
              position={[0.197, -1.278, 0.08]}
              rotation={[1.508, 0.153, -1.18]}
              onClick={(e) => handleItemClick('POTION', e.object.position)}
              onPointerOver={handlePointerOver}
              onPointerOut={handlePointerOut}
            />
          )}
        </group>
      </group>
      <MagicEffect position={effectPosition} show={showEffect} key={effectKey} />
    </>
  );
}

useGLTF.preload('/assets/caludron.glb');
