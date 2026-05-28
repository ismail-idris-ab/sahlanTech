import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function HeroBg() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
    camera.position.z = 28;

    // Dot grid
    const COLS = 42;
    const ROWS = 26;
    const SPACING = 2.1;
    const count = COLS * ROWS;

    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const origX = new Float32Array(count);
    const origY = new Float32Array(count);

    // Brand teal #068562 → (0.024, 0.522, 0.384)
    // Brand dark #013F4A → (0.004, 0.247, 0.290)
    for (let i = 0; i < COLS; i++) {
      for (let j = 0; j < ROWS; j++) {
        const idx = i * ROWS + j;
        const x = (i - COLS / 2) * SPACING;
        const y = (j - ROWS / 2) * SPACING;
        origX[idx] = x;
        origY[idx] = y;
        positions[idx * 3] = x;
        positions[idx * 3 + 1] = y;
        positions[idx * 3 + 2] = 0;
        // Blend teal → dark based on column position for depth feel
        const t = i / COLS;
        colors[idx * 3]     = 0.024 + t * (0.004 - 0.024);
        colors[idx * 3 + 1] = 0.522 + t * (0.247 - 0.522);
        colors[idx * 3 + 2] = 0.384 + t * (0.290 - 0.384);
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.22,
      vertexColors: true,
      transparent: true,
      opacity: 0.28,
      sizeAttenuation: true,
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    // Mouse tracking
    const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    const onMove = (e) => {
      mouse.tx = (e.clientX / window.innerWidth - 0.5) * 2;
      mouse.ty = -(e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("mousemove", onMove);

    // Resize
    const resize = () => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    window.addEventListener("resize", resize);
    resize();

    // Animation
    let rafId;
    let clock = 0;
    const posAttr = geometry.attributes.position;

    const tick = () => {
      rafId = requestAnimationFrame(tick);
      clock += 0.007;

      // Lerp mouse
      mouse.x += (mouse.tx - mouse.x) * 0.04;
      mouse.y += (mouse.ty - mouse.y) * 0.04;

      for (let i = 0; i < count; i++) {
        const x = origX[i];
        const y = origY[i];
        // Two overlapping sine waves for organic motion
        const z =
          Math.sin(x * 0.28 + clock) * Math.cos(y * 0.22 + clock * 0.6) * 1.8 +
          Math.sin(x * 0.15 - clock * 0.5) * 0.6;
        posAttr.setZ(i, z);
      }
      posAttr.needsUpdate = true;

      // Subtle camera drift following mouse
      camera.position.x += (mouse.x * 2.5 - camera.position.x) * 0.025;
      camera.position.y += (mouse.y * 1.5 - camera.position.y) * 0.025;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };
    tick();

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("resize", resize);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        zIndex: 0,
        pointerEvents: "none",
      }}
    />
  );
}
