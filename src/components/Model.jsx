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

export function Model({ scrollPercent, ...props }) {
  const group = useRef();
  const { nodes, materials, animations } = useGLTF('/assets/baked006.glb');
  const { actions } = useAnimations(animations, group);
  const [rotationOffset, setRotationOffset] = useState(0);
  const [hideBTC, setHideBTC] = useState(false); // State to hide BTC coin

// Refs
  const emissiveMaterialRef = useRef();

  // Load the texture
  const globeTexture = useTexture('/assets/world.jpg');

  // Flip the texture vertically
  useEffect(() => {
    globeTexture.flipY = false;
    globeTexture.needsUpdate = true; // Ensure the texture is updated after flipping
  }, [globeTexture]);


  const baseMaterial = useMemo(() => new THREE.MeshPhysicalMaterial({
    metalness: 0.75,
    roughness: 0.3,
    reflectivity: 1,
    clearcoat: 1,
    clearcoatRoughness: 0,
    transparent: true
  }), []);

  // Create materials with different colors based on the base material
  const materialsConfig = useMemo(() => ({
    orange: baseMaterial.clone(),
    purple: baseMaterial.clone(),
    blue: baseMaterial.clone(),
    green: baseMaterial.clone(),
    white: baseMaterial.clone(),
    black: baseMaterial.clone(),
  }), [baseMaterial]);

  useEffect(() => {
    materialsConfig.orange.color.set(0xffa500);
    materialsConfig.purple.color.set(0xA04FE7);
    materialsConfig.blue.color.set(0x4871AE);
    materialsConfig.green.color.set(0x39B273);
    materialsConfig.white.color.set(0xE7E7E7);
    materialsConfig.black.color.set(0x000000);
  }, [materialsConfig]);

  // Create the emissive material for the globe and attach the ref
  const emissiveMaterial = useMemo(() => {
    const material = new THREE.MeshStandardMaterial({
      emissive: new THREE.Color(0x8a2be2), // Initial globe color
      emissiveIntensity: 5,
    });
    emissiveMaterialRef.current = material;
    return material;
  }, [globeTexture]);


  // Create a scrollpath using a curve
  const path = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-1.5, -0.5, 0),
    new THREE.Vector3(0.0, 0.0, 0),
    new THREE.Vector3(0.0, 0, 0),
    new THREE.Vector3(0.0, 0, 0),
    new THREE.Vector3(0.0, 0, 0),
    new THREE.Vector3(0.0, 0, 0),
    new THREE.Vector3(-3.5, 0, 0)
  ]);

  // Update globe position and scale based on scroll percentage
  useEffect(() => {
    let pointOnPath = path.getPoint(scrollPercent);

    // Rotate the globe in the middle of the scroll
    if (scrollPercent > 0.3 && scrollPercent < 0.7) { // Adjusts the scroll range 
      const rotationSpeed = 0.001; // Change this value for faster or slower rotation
      const rotationProgress = (scrollPercent - 0.3) / 0.4; // Adjust the range length here
      const rotationAngle = rotationSpeed * rotationProgress * Math.PI * 2; // Full rotation per rotationSpeed
      setRotationOffset(rotationAngle);
      pointOnPath = path.getPoint(0.5); // Keep the globe centered during rotation
    } else {
      setRotationOffset(0); // Reset rotation outside the middle scroll
    }

    if (group.current) {
      group.current.position.copy(pointOnPath);
      group.current.rotation.y += rotationOffset;

      // Scale down the globe and scale up the coins when the scroll is done
      if (scrollPercent >= 1) {
        const scaleDownProgress = (scrollPercent - 1) / 0.05; // Adjust the range length here
        const globeScaleValue = THREE.MathUtils.lerp(1, 0, scaleDownProgress);
        const coinScaleValue = THREE.MathUtils.lerp(1, 2, scaleDownProgress);
        const opacityValue = THREE.MathUtils.lerp(1, 0, scaleDownProgress);
        group.current.scale.set(globeScaleValue, globeScaleValue, globeScaleValue);

        // Update the scale and opacity of the coins
        Object.keys(materialsConfig).forEach((key) => {
          materialsConfig[key].opacity = opacityValue;
        });

        nodes.BTC.scale.set(coinScaleValue, coinScaleValue, coinScaleValue);
        nodes.ETH.scale.set(coinScaleValue, coinScaleValue, coinScaleValue);
        nodes.MATI.scale.set(coinScaleValue, coinScaleValue, coinScaleValue);
        nodes.SOL.scale.set(coinScaleValue, coinScaleValue, coinScaleValue);
        nodes.USDC.scale.set(coinScaleValue, coinScaleValue, coinScaleValue);
        nodes.USDT.scale.set(coinScaleValue, coinScaleValue, coinScaleValue);
      } else {
        group.current.scale.set(1, 1, 1); // Reset scale before the end of the path
        Object.keys(materialsConfig).forEach((key) => {
          materialsConfig[key].opacity = 1;
        });
        nodes.BTC.scale.set(1, 1, 1);
        nodes.ETH.scale.set(1, 1, 1);
        nodes.MATI.scale.set(1, 1, 1);
        nodes.SOL.scale.set(1, 1, 1);
        nodes.USDC.scale.set(1, 1, 1);
        nodes.USDT.scale.set(1, 1, 1);
      }
    }
  }, [scrollPercent, rotationOffset, nodes, materialsConfig]);

  // Initialize animations and set up looping
  useEffect(() => {
    if (actions) {
      Object.values(actions).forEach(action => {
        action.setLoop(THREE.LoopRepeat, Infinity); // Ensure animations loop infinitely
        action.clampWhenFinished = false; // Don't clamp the last frame when the animation finishes
        action.play();
      });
    }
  }, [actions]);

  // Handle BTC coin click
  const handleBTCCoinClick = () => {
    if (emissiveMaterialRef.current) {
      emissiveMaterialRef.current.emissive.set(0xff0000); // Change globe color to red
    }
    setHideBTC(true); // Hide BTC coin
    console.log('BTC coin clicked');
  };


  // Create the sphere geometry
  const sphereGeometry = useMemo(() => new THREE.SphereGeometry(1, 16, 16), []); // Adjust the radius (1), widthSegments (32), and heightSegments (32) as needed

  return (
    <>
      <Environment preset="sunset" />
      <BloomEffect />
      <group ref={group} {...props} dispose={null}>
        <group name="Scene_noarc">
          <mesh name="GLOBE" geometry={sphereGeometry} material={emissiveMaterial}>
            {!hideBTC && (
              <mesh
                name="BTC"
                geometry={nodes.BTC.geometry}
                material={materialsConfig.orange}
                position={[-0.243, -0.791, -1.111]}
                rotation={[2.677, -0.196, 2.861]}
                onClick={handleBTCCoinClick}
              >
                <mesh name="BTC_LOGO" geometry={nodes.BTC_LOGO.geometry} material={materialsConfig.white} />
              </mesh>
            )}
            <mesh name="ETH" geometry={nodes.ETH.geometry} material={materialsConfig.white} position={[0.376, 1.006, 0.77]} rotation={[-1.047, 0.184, 1.076]}>
              <mesh name="ETH_LOGO" geometry={nodes.ETH_LOGO.geometry} material={materialsConfig.black} />
            </mesh>
            <mesh name="MATI" geometry={nodes.MATI.geometry} material={materialsConfig.purple} position={[-0.179, -1.277, 0.12]} rotation={[1.477, -0.139, 1.153]}>
              <mesh name="MATI_LOGO" geometry={nodes.MATI_LOGO.geometry} material={materialsConfig.white} />
            </mesh>
            <mesh name="P_BA006" geometry={nodes.P_BA006.geometry} material={materialsConfig.white} position={[0.507, 0.474, -0.719]} scale={0} />
            <mesh name="P_BENG" geometry={nodes.P_BENG.geometry} material={materialsConfig.white} position={[0.214, 0.243, -0.945]} scale={0} />
            <mesh name="P_BRIS007" geometry={nodes.P_BRIS007.geometry} material={materialsConfig.white} position={[-0.771, -0.436, -0.463]} scale={0} />
            <mesh name="P_BRU" geometry={nodes.P_BRU.geometry} material={materialsConfig.white} position={[0.628, 0.774, -0.08]} scale={0} />
            <mesh name="P_CAPE" geometry={nodes.P_CAPE.geometry} material={materialsConfig.white} position={[0.789, -0.535, -0.297]} scale={0.104} />
            <mesh name="P_KAIRO" geometry={nodes.P_KAIRO.geometry} material={materialsConfig.white} position={[0.777, 0.503, -0.377]} scale={0} />
            <mesh name="P_LAG" geometry={nodes.P_LAG.geometry} material={materialsConfig.white} position={[0.988, 0.1, -0.11]} scale={0} />
            <mesh name="P_MEX" geometry={nodes.P_MEX.geometry} material={materialsConfig.white} position={[-0.173, 0.349, 0.921]} scale={0} />
            <mesh name="P_MO006" geometry={nodes.P_MO006.geometry} material={materialsConfig.white} position={[0.226, 0.727, 0.645]} rotation={[0, 0.019, -0.019]} scale={0.01} />
            <mesh name="P_NY" geometry={nodes.P_NY.geometry} material={materialsConfig.white} position={[0.186, 0.639, 0.748]} scale={0} />
            <mesh name="P_SF" geometry={nodes.P_SF.geometry} material={materialsConfig.white} position={[-0.394, 0.589, 0.704]} scale={0} />
            <mesh name="P_SP" geometry={nodes.P_SP.geometry} material={materialsConfig.white} position={[0.658, -0.373, 0.653]} scale={0} />
            <mesh name="P_TOK" geometry={nodes.P_TOK.geometry} material={materialsConfig.white} position={[-0.61, 0.582, -0.537]} scale={0} />
            <mesh name="SOL" geometry={nodes.SOL.geometry} material={materialsConfig.black} position={[-0.534, 0.453, 0.865]} rotation={[-0.581, -0.438, -0.348]}>
              <group name="SOL_LOGO">
                <mesh name="Mesh_279005" geometry={nodes.Mesh_279005.geometry} material={materialsConfig.white} />
                <mesh name="Mesh_279005_1" geometry={nodes.Mesh_279005_1.geometry} material={materialsConfig.white} />
              </group>
            </mesh>
           
            <mesh name="USDC" geometry={nodes.USDC.geometry} material={materialsConfig.blue} position={[0.802, 0.378, 1.141]} rotation={[-0.232, 0.615, 0.128]}>
              <mesh name="USDC_LOGO" geometry={nodes.USDC_LOGO.geometry} material={materialsConfig.white} />
            </mesh>
            <mesh name="USDT" geometry={nodes.USDT.geometry} material={materialsConfig.green} position={[-0.682, 0.302, -0.84]} rotation={[-2.696, -0.756, 2.732]}>
              <mesh name="usdt_logo" geometry={nodes.usdt_logo.geometry} material={materialsConfig.white} />
            </mesh>
          </mesh>
        
        </group>
      </group>
    </>
  );
}

useGLTF.preload('/assets/baked006.glb');
