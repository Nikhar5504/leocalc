import React, { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';

import { OrbitControls, Box, Edges, Text, Billboard } from '@react-three/drei';

function Container({ width, height, depth, displayData }) {
    const { unit, vL, vW, vH } = displayData || {};
    // Modern "Stuck to wall" text style
    const labelStyle = {
        fontSize: Math.min(width, height, depth) * 0.15,
        color: "black",
        anchorX: "center",
        anchorY: "middle",
        fillOpacity: 0.7,
        fontWeight: 'bold',
        outlineWidth: 0, // No outline for cleaner "paint" look
    };

    return (
        <group>
            {/* Tinted Vehicle Box */}
            <Box args={[width, height, depth]} position={[0, 0, 0]}>
                <meshStandardMaterial
                    transparent
                    opacity={0.3}
                    color="#bfdbfe"
                    roughness={0.1}
                    metalness={0.1}
                />
                <Edges color="#000000" threshold={15} lineWidth={1} />
            </Box>

            {/* Labels Removed by User Request */}
        </group>
    );
}

const BaleNumber = ({ index, width, height, depth }) => {
    // Dynamic font size based on smallest dimension
    const fontSize = Math.min(width, height, depth) * 0.4;
    const color = "black";
    const offset = 0.01; // Slight offset to prevent z-fighting

    const sides = [
        { pos: [0, 0, depth / 2 + offset], rot: [0, 0, 0] }, // Front
        { pos: [0, 0, -depth / 2 - offset], rot: [0, Math.PI, 0] }, // Back
        { pos: [width / 2 + offset, 0, 0], rot: [0, Math.PI / 2, 0] }, // Right
        { pos: [-width / 2 - offset, 0, 0], rot: [0, -Math.PI / 2, 0] }, // Left
        { pos: [0, height / 2 + offset, 0], rot: [-Math.PI / 2, 0, 0] }, // Top
        { pos: [0, -height / 2 - offset, 0], rot: [Math.PI / 2, 0, 0] }, // Bottom
    ];

    return (
        <group>
            {sides.map((s, idx) => (
                <Text
                    key={idx}
                    position={s.pos}
                    rotation={s.rot}
                    fontSize={fontSize}
                    color={color}
                    anchorX="center"
                    anchorY="middle"
                >
                    {index}
                </Text>
            ))}
        </group>
    );
};

function Bales({ limit, bWidth, bHeight, bDepth, vWidth, vHeight, vDepth, displayData }) {
    const { unit, bL, bW, bH } = displayData || {};
    const bales = useMemo(() => {
        const arr = [];
        if (bWidth <= 0 || bHeight <= 0 || bDepth <= 0) return arr;

        // Fitment limits (Capacity)
        const nx = Math.floor(vWidth / bWidth);
        const ny = Math.floor(vHeight / bHeight);
        const nz = Math.floor(vDepth / bDepth);

        // Safety cap
        const totalCapable = nx * ny * nz;

        const startX = -vWidth / 2 + bWidth / 2;
        const startY = -vHeight / 2 + bHeight / 2;
        const startZ = -vDepth / 2 + bDepth / 2;

        let count = 0;
        // Fill until we hit the 'limit' (effectiveBales)
        // We fill Y first (stack up), then X, then Z usually? Or fill floor first (X, Z) then up (Y)?
        // Let's fill floor layer first: X then Z, then stack Y.
        // Actually standard loop order:
        // Vertical Stacking: Fill Y (Height) first to minimize floor footprint (Partial Loads)
        // Outer loops: Floor grid (X, Z). Inner loop: Height (Y).
        for (let x = 0; x < nx; x++) {
            for (let z = 0; z < nz; z++) {
                for (let y = 0; y < ny; y++) {
                    if (count >= limit) return arr; // Stop exactly at limit

                    arr.push({
                        pos: [
                            startX + x * bWidth,
                            startY + y * bHeight,
                            startZ + z * bDepth
                        ]
                    });
                    count++;
                }
            }
        }
        return arr;
    }, [limit, bWidth, bHeight, bDepth, vWidth, vHeight, vDepth]);

    // High count optimization: render simplified volume if insane number
    if (limit > 3000) {
        // Just render a box for now as placeholder for perf
        // or just cap it.
        return (
            <group>
                {/* Optimization: Render slightly fewer or blocks if needed, but for now just capped loop above works */}
            </group>
        );
    }

    return (
        <group>
            {bales.map((b, i) => (
                <group key={i} position={b.pos}>
                    <Box args={[bWidth, bHeight, bDepth]}>
                        <meshStandardMaterial color="#ffffff" roughness={0.4} />
                        <Edges color="#000000" threshold={15} lineWidth={1.5} />
                    </Box>

                    {/* Numbering on 6 sides */}
                    <BaleNumber index={i + 1} width={bWidth} height={bHeight} depth={bDepth} />
                </group>
            ))}
        </group>
    );
}

export default function BaleVisualizer({ vehicleDims, baleDims, effectiveCount, displayData }) {
    // effectiveCount comes in as the limit. 
    // If it's undefined/null, we might want a fallback, but logic handles it.

    const maxDim = Math.max(vehicleDims.l, vehicleDims.w, vehicleDims.h) || 1;
    const scale = 8 / maxDim;

    const vW = vehicleDims.l * scale;
    const vH = vehicleDims.h * scale;
    const vD = vehicleDims.w * scale;

    const bW = baleDims.l * scale;
    const bH = baleDims.h * scale;
    const bD = baleDims.w * scale;

    return (
        <Canvas camera={{ position: [8, 8, 8], fov: 45 }}>
            <color attach="background" args={['#f1f5f9']} />
            <ambientLight intensity={0.7} />
            <directionalLight position={[10, 20, 10]} intensity={1} castShadow />
            <directionalLight position={[-10, 10, -10]} intensity={0.5} />

            {/* Auto Rotate Disabled */}
            <OrbitControls autoRotate={false} dampeningFactor={0.1} />

            <group position={[0, -vH / 4, 0]}>
                <Container width={vW} height={vH} depth={vD} displayData={displayData} />
                <Bales
                    limit={effectiveCount}
                    bWidth={bW} bHeight={bH} bDepth={bD}
                    vWidth={vW} vHeight={vH} vDepth={vD}
                    displayData={displayData}
                />
            </group>
        </Canvas>
    );
}
