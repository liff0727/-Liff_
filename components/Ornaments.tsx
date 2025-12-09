
import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useMorphAnimation } from './store';
import { crystalMaterial, metalBaubleMaterial, velvetMaterial, starMaterial, pearlMaterial } from './TreeMaterials';

// Types of ornaments
type OrnamentType = 'SPHERE_CRYSTAL' | 'SPHERE_METAL' | 'BOX' | 'STAR' | 'PEARL';

interface OrnamentData {
    type: OrnamentType;
    treePos: THREE.Vector3;
    dreamPos: THREE.Vector3;
    rotationOffset: THREE.Euler;
    scale: number;
    speed: number;
}

const Ornaments: React.FC = () => {
    const count = 150; // Standard Ornaments
    const pearlCount = 200; // Pearls for the necklace
    const { getEasedProgress } = useMorphAnimation();
    
    // Refs
    const crystalRef = useRef<THREE.InstancedMesh>(null);
    const metalRef = useRef<THREE.InstancedMesh>(null);
    const boxRef = useRef<THREE.InstancedMesh>(null);
    const starRef = useRef<THREE.InstancedMesh>(null);
    const pearlRef = useRef<THREE.InstancedMesh>(null);

    // Reusable dummy object for matrix calculations (Avoids GC)
    const dummy = useMemo(() => new THREE.Object3D(), []);

    // Generate Data for Standard Ornaments + Pearls
    const { allData, typeCounts } = useMemo(() => {
        const data: OrnamentData[] = [];
        const counts = {
            SPHERE_CRYSTAL: 0,
            SPHERE_METAL: 0,
            BOX: 0,
            STAR: 0,
            PEARL: 0
        };

        // 1. Standard Scatter
        for (let i = 0; i < count; i++) {
            const rand = Math.random();
            let type: OrnamentType = 'SPHERE_METAL';
            if (rand > 0.85) type = 'BOX';
            else if (rand > 0.70) type = 'SPHERE_CRYSTAL';
            else if (rand > 0.60) type = 'STAR';
            
            counts[type]++;

            // Cone Surface
            const y = (Math.random() * 5.5) - 2.0; 
            const coneRatio = 1.0 - ((y + 2.0) / 6.0);
            const r = coneRatio * 2.5; 
            const theta = Math.random() * Math.PI * 2;
            
            const treePos = new THREE.Vector3(
                Math.cos(theta) * (r + 0.1),
                y,
                Math.sin(theta) * (r + 0.1)
            );

            // Dream Scatter
            const dR = r * 5.0 + 3.0;
            const dTheta = theta + Math.PI;
            const dreamPos = new THREE.Vector3(
                Math.cos(dTheta) * dR,
                y * 1.5 + (Math.random() - 0.5) * 5.0,
                Math.sin(dTheta) * dR
            );

            data.push({
                type,
                treePos,
                dreamPos,
                rotationOffset: new THREE.Euler(Math.random()*Math.PI, Math.random()*Math.PI, 0),
                scale: Math.random() * 0.15 + 0.1,
                speed: Math.random() * 0.5 + 0.2
            });
        }

        // 2. Pearl Necklace (Spiral)
        for (let i = 0; i < pearlCount; i++) {
             counts.PEARL++;
             
             // Spiral Logic
             // 4 full turns from bottom to top
             const t = (i / pearlCount); // 0 to 1
             const y = -1.8 + t * 5.5; // Height range
             const turns = 5.0 * Math.PI * 2;
             const angle = t * turns;
             
             const coneRatio = 1.0 - ((y + 2.0) / 6.0);
             const r = coneRatio * 2.6; // Slightly outside foliage
             
             const treePos = new THREE.Vector3(
                 Math.cos(angle) * r,
                 y,
                 Math.sin(angle) * r
             );
             
             // Pearls scatter into a galaxy ring in dream mode
             const dAngle = angle + Math.PI / 2;
             const dR = 8.0 + (Math.random() - 0.5) * 2.0;
             const dreamPos = new THREE.Vector3(
                 Math.cos(dAngle) * dR,
                 (Math.random() - 0.5) * 2.0, // Flattened disk
                 Math.sin(dAngle) * dR
             );

             data.push({
                 type: 'PEARL',
                 treePos,
                 dreamPos,
                 rotationOffset: new THREE.Euler(0,0,0),
                 scale: 0.08, // Small pearls
                 speed: 0.1
             });
        }

        return { allData: data, typeCounts: counts };
    }, []);

    const updateMesh = (
        ref: React.RefObject<THREE.InstancedMesh | null>, 
        type: OrnamentType, 
        progress: number,
        time: number
    ) => {
        if (!ref.current) return;
        
        let idx = 0;

        allData.forEach((d) => {
            if (d.type !== type) return;

            // Position Morph
            const x = THREE.MathUtils.lerp(d.treePos.x, d.dreamPos.x, progress);
            const y = THREE.MathUtils.lerp(d.treePos.y, d.dreamPos.y, progress);
            const z = THREE.MathUtils.lerp(d.treePos.z, d.dreamPos.z, progress);
            
            // Float effect (Pearls float less)
            const floatScale = type === 'PEARL' ? 0.2 : 0.5;
            const float = Math.sin(time * d.speed + d.treePos.x) * floatScale * progress;

            dummy.position.set(x, y + float, z);
            
            // Rotation
            dummy.rotation.copy(d.rotationOffset);
            dummy.rotation.y += time * 0.1;
            dummy.rotation.x += time * 0.05 * progress;

            // Scale
            const s = d.scale * (1 + progress * 0.5);
            dummy.scale.set(s, s, s);

            dummy.updateMatrix();
            ref.current!.setMatrixAt(idx, dummy.matrix);
            idx++;
        });
        ref.current.instanceMatrix.needsUpdate = true;
    };

    useFrame((state) => {
        const progress = getEasedProgress();
        const time = state.clock.elapsedTime;

        updateMesh(crystalRef, 'SPHERE_CRYSTAL', progress, time);
        updateMesh(metalRef, 'SPHERE_METAL', progress, time);
        updateMesh(boxRef, 'BOX', progress, time);
        updateMesh(starRef, 'STAR', progress, time);
        updateMesh(pearlRef, 'PEARL', progress, time);
    });

    return (
        <group>
            {/* Crystal Spheres - Use Icosahedron for Cut Crystal Look */}
            <instancedMesh ref={crystalRef} args={[undefined, undefined, typeCounts.SPHERE_CRYSTAL]}>
                <icosahedronGeometry args={[1, 0]} /> {/* Faceted low poly look */}
                <primitive object={crystalMaterial} attach="material" />
            </instancedMesh>

            {/* Metal Baubles - Higher Segments for Ultra-Clear Reflections */}
            <instancedMesh ref={metalRef} args={[undefined, undefined, typeCounts.SPHERE_METAL]}>
                <sphereGeometry args={[1, 64, 64]} />
                <primitive object={metalBaubleMaterial} attach="material" />
            </instancedMesh>

            {/* Velvet Gift Boxes */}
            <instancedMesh ref={boxRef} args={[undefined, undefined, typeCounts.BOX]}>
                <boxGeometry args={[1.5, 1.5, 1.5]} />
                <primitive object={velvetMaterial} attach="material" />
            </instancedMesh>

             {/* Star Pendants */}
             <instancedMesh ref={starRef} args={[undefined, undefined, typeCounts.STAR]}>
                <octahedronGeometry args={[1, 0]} />
                <primitive object={starMaterial} attach="material" />
            </instancedMesh>

            {/* Pearls - Higher Segments */}
            <instancedMesh ref={pearlRef} args={[undefined, undefined, typeCounts.PEARL]}>
                <sphereGeometry args={[1, 32, 32]} />
                <primitive object={pearlMaterial} attach="material" />
            </instancedMesh>
        </group>
    );
};

export default Ornaments;
