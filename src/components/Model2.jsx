import React, { useRef, useEffect, useMemo, useState } from 'react';
import { Canvas, extend, useFrame, useThree } from '@react-three/fiber';
import { useGLTF, useAnimations, Environment, useTexture } from '@react-three/drei';
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

export function Model(props) {
  const group = useRef();
  const { nodes, materials, animations } = useGLTF('/assets/caludron.glb');
  const { actions } = useAnimations(animations, group);
  const [potionColor, setPotionColor] = useState(new THREE.Color(0x00ff00)); // Initial Potion color

  // Create a base material for the Potion
  const potionMaterial = useMemo(() => new THREE.MeshStandardMaterial({ color: potionColor }), [potionColor]);

  // Update Potion and its children's material when the potionColor changes
  useEffect(() => {
    if (nodes.Potion) {
      nodes.Potion.material = potionMaterial;
      nodes.BUB1.material = potionMaterial;
      nodes.BUB2.material = potionMaterial;
      nodes.BUB3.material = potionMaterial;
      nodes.BUB4.material = potionMaterial;
      nodes.BUB5.material = potionMaterial;
    }
  }, [potionColor, nodes, potionMaterial]);

  useEffect(() => {
    if (actions) {
      Object.values(actions).forEach(action => {
        action.setLoop(THREE.LoopRepeat, Infinity); // Ensure animations loop infinitely
        action.clampWhenFinished = false; // Don't clamp the last frame when the animation finishes
        action.play();
      });
    }
  }, [actions]);

  // Handle EYE click
  const handleEyeClick = () => {
    setPotionColor(new THREE.Color(0xff0000)); // Change Potion color to red
    console.log('EYE clicked');
  };

  return (
    <>
      <Environment preset="sunset" />
      <BloomEffect />
      <group ref={group} {...props} dispose={null}>
        <group name="MAGIC">
          <group name="PATH_FANG" position={[0.031, -0.212, -0.045]} rotation={[0.468, -0.273, -0.066]} scale={[1.212, 1.226, 1.323]} />
          <group name="PATH_EYE" position={[0, -0.076, -0.186]} rotation={[-1.957, 0.442, -Math.PI]} scale={1.307} />
          <group name="PATH_POTION" rotation={[1.508, 0.153, -1.18]} scale={1.296} />
          <group name="PATH_SHROOM" position={[0.031, -0.192, -0.03]} rotation={[-1.773, 1.036, 1.746]} scale={1.136} />
          <group name="PATH_FEATHER" position={[-0.084, -0.101, 0]} rotation={[-0.547, -0.24, -0.749]} scale={1.231} />
          <group name="PATH_ROSE" position={[0, 0.111, 0]} rotation={[-2.951, -0.099, -3.122]} scale={1.421} />
          <mesh name="CALUDRON" geometry={nodes.CALUDRON.geometry} material={materials.Gold}>
            <mesh name="Potion" geometry={nodes.Potion.geometry} material={potionMaterial}>
              <mesh name="BUB1" geometry={nodes.BUB1.geometry} material={potionMaterial} position={[-0.183, 0.72, 0.066]} scale={0.049} />
              <mesh name="BUB2" geometry={nodes.BUB2.geometry} material={potionMaterial} position={[-0.195, 0.575, 0.196]} rotation={[0, -1.474, 0]} scale={0.041} />
              <mesh name="BUB3" geometry={nodes.BUB3.geometry} material={potionMaterial} position={[0.149, 0.541, 0.384]} scale={0.023} />
              <mesh name="BUB4" geometry={nodes.BUB4.geometry} material={potionMaterial} position={[-0.152, 0.441, -0.398]} scale={0.041} />
              <mesh name="BUB5" geometry={nodes.BUB5.geometry} material={potionMaterial} position={[0.051, 0.442, -0.029]} scale={0.079} />
            </mesh>
          </mesh>
          <mesh name="ROSE" geometry={nodes.ROSE.geometry} material={materials.chinese_rose_mat} position={[-0.14, 0.378, -1.388]} rotation={[-2.951, -0.099, -3.122]} scale={1.25} />
          <mesh name="FANG" geometry={nodes.FANG.geometry} material={materials.lambert2} position={[-0.325, -0.787, 1.093]} rotation={[0.468, -0.273, -0.066]} />
          <mesh name="SHROOM" geometry={nodes.SHROOM.geometry} material={materials['default']} position={[1.008, 0.448, -0.146]} rotation={[-1.773, 1.036, 1.746]} />
          <mesh name="EYE" geometry={nodes.EYE.geometry} material={materials.PM3D_Sphere3D_1} position={[0.559, 1.019, -0.631]} rotation={[-1.957, 0.442, -Math.PI]} onClick={handleEyeClick} />
          <mesh name="FEATHER" geometry={nodes.FEATHER.geometry} material={materials.Material} position={[-0.377, 0.52, 1.022]} rotation={[-0.547, -0.24, -0.749]} />
          <mesh name="POTION" geometry={nodes.POTION.geometry} material={materials.Potion_mat} position={[0.197, -1.278, 0.08]} rotation={[1.508, 0.153, -1.18]} />
        </group>
      </group>
    </>
  );
}

useGLTF.preload('/assets/caludron.glb');
