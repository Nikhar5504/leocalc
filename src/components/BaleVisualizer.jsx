import React, { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Edges } from '@react-three/drei';

// Bales Component without diagonal lines (using Edges instead of wireframe)
const Bales = ({ count, bWidth, bHeight, bDepth, vWidth, vHeight, vDepth }) => {
    const coords = useMemo(() => {
        const arr = [];
        if (bWidth <= 0.01 || bHeight <= 0.01 || bDepth <= 0.01) return arr;

        const nx = Math.floor(vWidth / bWidth) || 1;
        const ny = Math.floor(vHeight / bHeight) || 1;
        const nz = Math.floor(vDepth / bDepth) || 1;

        // Performance cap
        const maxRender = 1000;

        // Start Logic for Centering or Standard Filling
        const startX = -vWidth / 2 + bWidth / 2;
        const startY = -vHeight / 2 + bHeight / 2; // Floor is at -vH/2
        const startZ = -vDepth / 2 + bDepth / 2;

        let c = 0;

        // Z (Back-to-Front) -> Y (Bottom-to-Top) -> X (Left-to-Right)
        // User requested: "adjusted from the back side ... if it is loaded in a flat way, then height is decreasing"
        // This implies filling the FULL VERTICAL SLICE at the back before moving forward.
        for (let x = 0; x < nx; x++) {          // Depth (Front to Back or vice versa depending on camera)
            for (let y = 0; y < ny; y++) {      // Height
                for (let z = 0; z < nz; z++) {  // Width
                    if (c >= count) return arr;
                    if (c >= maxRender) return arr;

                    arr.push([
                        startX + x * bWidth,  // X (Length) Position: Controlled by x (Index along Length).
                        startY + y * bHeight, // Y (Height) Position: Controlled by y (Index along Height).
                        startZ + z * bDepth   // Z (Width) Position: Controlled by z (Index along Width).
                    ]);
                    c++;
                }
            }
        }
        return arr;
    }, [count, bWidth, bHeight, bDepth, vWidth, vHeight, vDepth]);

    return (
        <group>
            {coords.map((pos, i) => (
                <mesh key={i} position={pos}>
                    <boxGeometry args={[bWidth * 0.99, bHeight * 0.99, bDepth * 0.99]} />
                    <meshStandardMaterial color="#ffffff" roughness={0.3} metallic={0.1} />
                    {/* Clean black edges without diagonals */}
                    <Edges
                        threshold={15} // Only show sharp edges
                        color="black"
                        scale={1}
                    />
                </mesh>
            ))}
        </group>
    );
};

// Container with clean, bold, transparent edges
const Container = ({ width, height, depth }) => {
    const w = Math.max(width, 0.1);
    const h = Math.max(height, 0.1);
    const d = Math.max(depth, 0.1);

    return (
        <group>
            {/* Box Volume */}
            <mesh>
                <boxGeometry args={[w, h, d]} />
                <meshStandardMaterial color="#e0f2fe" transparent opacity={0.1} depthWrite={false} side={2} />
            </mesh>

            {/* Clean Outer Edges - Bold & Transparent */}
            <mesh>
                <boxGeometry args={[w, h, d]} />
                <meshBasicMaterial transparent opacity={0} /> {/* Invisible mesh for edges */}
                <Edges
                    threshold={1}
                    color="black"
                    // Creating "Bold" effect
                    linewidth={2}
                >
                    <meshBasicMaterial color="black" transparent opacity={0.4} />
                </Edges>
            </mesh>
        </group>
    );
};


export default function BaleVisualizer({ vehicleDims, baleDims, effectiveCount }) {
    // 1. Inputs Normalization
    const vL = Number(vehicleDims?.l || 1);
    const vW = Number(vehicleDims?.w || 1);
    const vH = Number(vehicleDims?.h || 1);

    // Scale Logic
    const maxDim = Math.max(vL, vW, vH) || 10;
    const scale = 10 / maxDim;

    const sL = vL * scale;
    const sW = vW * scale; // Width -> Depth (Z)
    const sH = vH * scale;

    const bL = Number(baleDims?.l || 0) * scale;
    const bW = Number(baleDims?.w || 0) * scale; // Width -> Depth (Z)
    const bH = Number(baleDims?.h || 0) * scale;

    return (
        <div style={{ width: '100%', height: '100%', minHeight: '400px', background: '#f8fafc' }}>
            <Canvas camera={{ position: [8, 8, 8], fov: 45 }}>
                <ambientLight intensity={0.9} />
                <directionalLight position={[10, 20, 10]} intensity={1.2} />
                <OrbitControls makeDefault minPolarAngle={0} maxPolarAngle={Math.PI / 1.9} />

                <group position={[0, 0, 0]}>
                    <Container width={sL} height={sH} depth={sW} />
                    <Bales count={effectiveCount} bWidth={bL} bHeight={bH} bDepth={bW} vWidth={sL} vHeight={sH} vDepth={sW} />
                </group>

                <gridHelper args={[20, 20, '#cbd5e1', '#e2e8f0']} position={[0, -sH / 2, 0]} />
            </Canvas>
        </div>
    );
}
