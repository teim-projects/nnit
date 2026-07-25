import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

/* ═══════════════════════════════════════════════════════════════════════
   NNIT PARKING — FULL LOGIN PAGE (Single JSX File)
   ═══════════════════════════════════════════════════════════════════════ */

// ── SVG ICONS ──────────────────────────────────────────────────────────
const IconMail = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="16" x="2" y="4" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);

const IconLock = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const IconEye = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const IconEyeOff = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
    <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
    <line x1="2" x2="22" y1="2" y2="22" />
  </svg>
);

const IconArrowRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14" />
    <path d="m12 5 7 7-7 7" />
  </svg>
);

// Custom NNIT Stacked Parking Logo Icon
const IconNNITLogoMark = () => (
  <svg width="36" height="36" viewBox="0 0 100 100" fill="none">
    <path d="M5 5L30 5L30 30L15 30Z" fill="#0F4C81" />
    <g fill="#F26522">
      <path d="M30 18 C30 18, 50 18, 70 18 C85 18, 88 32, 88 32 L30 32 Z" />
      <circle cx="68" cy="32" r="7" fill="#FFFFFF" />
      <circle cx="68" cy="32" r="4" fill="#F26522" />
      
      <path d="M22 46 C22 46, 42 46, 62 46 C77 46, 80 60, 80 60 L22 60 Z" />
      <circle cx="60" cy="60" r="7" fill="#FFFFFF" />
      <circle cx="60" cy="60" r="4" fill="#F26522" />
      
      <path d="M14 74 C14 74, 34 74, 54 74 C69 74, 72 88, 72 88 L14 88 Z" />
      <circle cx="52" cy="88" r="7" fill="#FFFFFF" />
      <circle cx="52" cy="88" r="4" fill="#F26522" />
    </g>
  </svg>
);

const IconShield = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

const IconLayers = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z" />
    <path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65" />
    <path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65" />
  </svg>
);

const IconCheckCircle = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

const IconScan = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 7V5a2 2 0 0 1 2-2h2" />
    <path d="M17 3h2a2 2 0 0 1 2 2v2" />
    <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
    <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
    <line x1="7" y1="12" x2="17" y2="12" />
  </svg>
);

const IconGoogle = () => (
  <svg width="18" height="18" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
  </svg>
);

const IconUserPlus = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="8.5" cy="7" r="4" />
    <line x1="20" y1="8" x2="20" y2="14" />
    <line x1="23" y1="11" x2="17" y2="11" />
  </svg>
);

// ── BRAND COMPONENT ────────────────────────────────────────────────────
function Brand({ inverse = false }) {
  return (
    <div className={`brand ${inverse ? "brand--inverse" : ""}`}>
      <div className="brand__mark">
        <IconNNITLogoMark />
      </div>
      <div className="brand__copy">
        <strong>NNIT</strong>
        <small>CAR PARKING SYSTEMS PVT. LTD.</small>
      </div>
    </div>
  );
}

// ── CANVAS TEXTURE HELPER ──────────────────────────────────────────────
function makeCanvasLabel(text, fg, bg, w = 640, h = 180) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d");
  if (!ctx) return new THREE.CanvasTexture(c);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = fg;
  ctx.font = `800 ${Math.round(h * 0.42)}px Arial, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, w / 2, h / 2 + 3);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

// ── CAR FACTORY ────────────────────────────────────────────────────────
function createCar(color) {
  const car = new THREE.Group();
  const paint = new THREE.MeshPhysicalMaterial({
    color,
    roughness: 0.22,
    metalness: 0.18,
    clearcoat: 0.72,
    clearcoatRoughness: 0.2,
  });
  const glass = new THREE.MeshPhysicalMaterial({
    color: 0x0f2a4a,
    roughness: 0.08,
    metalness: 0.2,
    transparent: true,
    opacity: 0.92,
  });
  const tireMat = new THREE.MeshStandardMaterial({ color: 0x121918, roughness: 0.88 });
  const rimMat = new THREE.MeshStandardMaterial({ color: 0xcbd5d8, roughness: 0.28, metalness: 0.75 });
  const headlightMat = new THREE.MeshStandardMaterial({ color: 0xfff3d5, emissive: 0xffc870, emissiveIntensity: 1.8 });
  const tailMat = new THREE.MeshStandardMaterial({ color: 0xff594d, emissive: 0xff2a1a, emissiveIntensity: 1.2 });
  const bumperMat = new THREE.MeshStandardMaterial({ color: 0x18211f, roughness: 0.55, metalness: 0.12 });

  // Chassis
  const chassis = new THREE.Mesh(new THREE.CapsuleGeometry(0.44, 1.1, 6, 18), paint);
  chassis.rotation.x = Math.PI / 2;
  chassis.scale.set(1.08, 1, 0.72);
  chassis.position.y = 0.43;
  chassis.castShadow = true;
  chassis.receiveShadow = true;
  car.add(chassis);

  // Cabin
  const cabinShape = new THREE.Shape();
  cabinShape.moveTo(-0.68, 0);
  cabinShape.lineTo(-0.38, 0.39);
  cabinShape.quadraticCurveTo(-0.29, 0.48, -0.12, 0.49);
  cabinShape.lineTo(0.37, 0.49);
  cabinShape.quadraticCurveTo(0.49, 0.47, 0.62, 0.12);
  cabinShape.lineTo(0.68, 0);
  cabinShape.closePath();
  const cabinGeo = new THREE.ExtrudeGeometry(cabinShape, {
    depth: 0.73,
    bevelEnabled: true,
    bevelSize: 0.035,
    bevelThickness: 0.035,
    bevelSegments: 3,
  });
  cabinGeo.center();
  cabinGeo.rotateY(Math.PI / 2);
  const cabin = new THREE.Mesh(cabinGeo, glass);
  cabin.position.set(0, 0.77, -0.04);
  cabin.castShadow = true;
  car.add(cabin);

  // Roof
  const roof = new THREE.Mesh(new THREE.BoxGeometry(0.73, 0.055, 0.5), paint);
  roof.position.set(0, 1.01, -0.08);
  roof.castShadow = true;
  car.add(roof);

  // Bumpers
  [-0.87, 0.87].forEach((z) => {
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.08, 0.055), bumperMat);
    b.position.set(0, 0.3, z);
    car.add(b);
  });

  // Headlights + Tail lights
  [-0.29, 0.29].forEach((x) => {
    const h = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.09, 0.035), headlightMat);
    h.position.set(x, 0.49, 0.9);
    car.add(h);
    const t = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.09, 0.035), tailMat);
    t.position.set(x, 0.49, -0.9);
    car.add(t);
  });

  // Wheels
  const wheelGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.12, 22);
  const rimGeo = new THREE.CylinderGeometry(0.095, 0.095, 0.126, 18);
  const wheels = [];
  [
    [-0.48, 0.28, -0.56],
    [0.48, 0.28, -0.56],
    [-0.48, 0.28, 0.56],
    [0.48, 0.28, 0.56],
  ].forEach(([x, y, z]) => {
    const wg = new THREE.Group();
    const tire = new THREE.Mesh(wheelGeo, tireMat);
    const rim = new THREE.Mesh(rimGeo, rimMat);
    tire.rotation.z = Math.PI / 2;
    rim.rotation.z = Math.PI / 2;
    tire.castShadow = true;
    wg.add(tire, rim);
    wg.position.set(x, y, z);
    car.add(wg);
    wheels.push(wg);
  });

  car.userData.wheels = wheels;
  car.scale.setScalar(0.82);
  return car;
}

// ── TREE HELPER ────────────────────────────────────────────────────────
function addTree(parent, x, z, scale = 1) {
  const tree = new THREE.Group();
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x8b6646, roughness: 1 });
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x3d7059, roughness: 0.82 });
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 0.62, 8), trunkMat);
  trunk.position.y = 0.31;
  trunk.castShadow = true;
  const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(0.43, 1), leafMat);
  crown.scale.set(1, 1.25, 1);
  crown.position.y = 0.93;
  crown.castShadow = true;
  tree.add(trunk, crown);
  tree.position.set(x, 0.15, z);
  tree.scale.setScalar(scale);
  parent.add(tree);
}

// ── 3D PARKING MODEL ──────────────────────────────────────────────────
function ParkingModel() {
  const mountRef = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Scene
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x0a2239, 16, 31);

    // Camera
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
    camera.position.set(10.8, 8.9, 12.2);
    camera.lookAt(0, 0.1, 1.1);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x071a2e, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.setAttribute("aria-hidden", "true");
    mount.appendChild(renderer.domElement);

    // World group
    const world = new THREE.Group();
    world.position.y = -0.55;
    scene.add(world);

    // Lighting
    scene.add(new THREE.HemisphereLight(0xe2f1ff, 0x0f2a42, 2.6));
    const sun = new THREE.DirectionalLight(0xfff3e0, 5.2);
    sun.position.set(7, 13, 9);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -12;
    sun.shadow.camera.right = 12;
    sun.shadow.camera.top = 12;
    sun.shadow.camera.bottom = -12;
    sun.shadow.bias = -0.0007;
    scene.add(sun);
    const rimLight = new THREE.PointLight(0xf26522, 22, 18, 2);
    rimLight.position.set(-6, 5, 5);
    scene.add(rimLight);

    // Materials
    const concrete = new THREE.MeshStandardMaterial({ color: 0xdcdfdc, roughness: 0.9 });
    const curbMat = new THREE.MeshStandardMaterial({ color: 0xf2f4f5, roughness: 0.75 });
    const asphalt = new THREE.MeshStandardMaterial({ color: 0x222b35, roughness: 0.91 });
    const lineMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.65, emissive: 0x444444, emissiveIntensity: 0.08 });
    const orange = new THREE.MeshStandardMaterial({ color: 0xF26522, roughness: 0.36, metalness: 0.05 });
    const navy = new THREE.MeshStandardMaterial({ color: 0x0F4C81, roughness: 0.55 });
    const charcoal = new THREE.MeshStandardMaterial({ color: 0x161e27, roughness: 0.58 });
    const planterMat = new THREE.MeshStandardMaterial({ color: 0xb9c0c7, roughness: 0.88 });

    // Shadow receiver
    const shadowFloor = new THREE.Mesh(new THREE.PlaneGeometry(36, 30), new THREE.ShadowMaterial({ color: 0x020d18, opacity: 0.32 }));
    shadowFloor.rotation.x = -Math.PI / 2;
    shadowFloor.position.y = -0.17;
    shadowFloor.receiveShadow = true;
    world.add(shadowFloor);

    // Base platform
    const base = new THREE.Mesh(new THREE.BoxGeometry(11.8, 0.34, 8.8), concrete);
    base.castShadow = true;
    base.receiveShadow = true;
    world.add(base);

    // Asphalt lot
    const lot = new THREE.Mesh(new THREE.BoxGeometry(10.9, 0.08, 7.85), asphalt);
    lot.position.y = 0.2;
    lot.receiveShadow = true;
    world.add(lot);

    // Entry road
    const entryBase = new THREE.Mesh(new THREE.BoxGeometry(3.35, 0.32, 6.8), concrete);
    entryBase.position.set(2.77, 0, 7.25);
    entryBase.receiveShadow = true;
    world.add(entryBase);
    const entryRoad = new THREE.Mesh(new THREE.BoxGeometry(2.78, 0.08, 6.8), asphalt);
    entryRoad.position.set(2.77, 0.2, 7.25);
    entryRoad.receiveShadow = true;
    world.add(entryRoad);

    // Parking lines
    const addLine = (x, z, w, d, m = lineMat) => {
      const l = new THREE.Mesh(new THREE.BoxGeometry(w, 0.018, d), m);
      l.position.set(x, 0.252, z);
      l.receiveShadow = true;
      world.add(l);
      return l;
    };
    [-4.7, -2.95, -1.2, 0.55].forEach((x) => addLine(x, -1.75, 0.045, 2.65));
    addLine(-2.08, -3.04, 5.25, 0.045);
    addLine(-2.08, -0.46, 5.25, 0.045);
    addLine(2.77, 6.1, 0.055, 8.5, orange);
    [4.75, 6.25, 7.75].forEach((z) => {
      addLine(2.77, z, 0.45, 0.07, lineMat).rotation.y = Math.PI / 4;
    });

    // Directional arrow
    const arrowShape = new THREE.Shape();
    arrowShape.moveTo(0, 0.42);
    arrowShape.lineTo(0.37, 0.03);
    arrowShape.lineTo(0.13, 0.03);
    arrowShape.lineTo(0.13, -0.4);
    arrowShape.lineTo(-0.13, -0.4);
    arrowShape.lineTo(-0.13, 0.03);
    arrowShape.lineTo(-0.37, 0.03);
    arrowShape.closePath();
    const arrow = new THREE.Mesh(new THREE.ShapeGeometry(arrowShape), orange);
    arrow.rotation.x = -Math.PI / 2;
    arrow.rotation.z = Math.PI;
    arrow.position.set(2.77, 0.265, 5.8);
    world.add(arrow);

    // Parked cars
    const whiteCar = createCar(0xf5f7fa);
    whiteCar.position.set(-3.82, 0.24, -1.76);
    world.add(whiteCar);
    const orangeCar = createCar(0xF26522);
    orangeCar.position.set(-2.08, 0.24, -1.76);
    world.add(orangeCar);
    const navyCar = createCar(0x0F4C81);
    navyCar.position.set(-0.34, 0.24, -1.76);
    world.add(navyCar);

    // Building
    const building = new THREE.Group();
    const bBody = new THREE.Mesh(new THREE.BoxGeometry(7.3, 1.65, 0.55), curbMat);
    bBody.position.y = 0.92;
    bBody.castShadow = true;
    bBody.receiveShadow = true;
    const bBand = new THREE.Mesh(new THREE.BoxGeometry(7.42, 0.22, 0.62), navy);
    bBand.position.y = 1.71;
    bBand.castShadow = true;
    const winMat = new THREE.MeshPhysicalMaterial({
      color: 0x0a2239,
      roughness: 0.1,
      metalness: 0.15,
      transparent: true,
      opacity: 0.94,
    });
    [-2.55, -1.45, 1.65, 2.75].forEach((x) => {
      const w = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.68, 0.035), winMat);
      w.position.set(x, 0.95, 0.295);
      building.add(w);
    });
    const garage = new THREE.Mesh(new THREE.BoxGeometry(1.95, 1.18, 0.07), charcoal);
    garage.position.set(0.12, 0.72, 0.31);
    building.add(bBody, bBand, garage);
    building.position.set(-1.05, 0.18, -4.1);
    world.add(building);

    // Brand sign
    const brandTex = makeCanvasLabel("NNIT PARKING", "#FFFFFF", "#F26522");
    const brandSign = new THREE.Mesh(new THREE.PlaneGeometry(2.85, 0.8), new THREE.MeshBasicMaterial({ map: brandTex }));
    brandSign.position.set(-1.05, 1.25, -3.79);
    world.add(brandSign);

    // Parking sign
    const signGroup = new THREE.Group();
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.075, 1.45, 12), navy);
    post.position.y = 0.73;
    const pTex = makeCanvasLabel("P", "#FFFFFF", "#0F4C81", 320, 320);
    const board = new THREE.Mesh(
      new THREE.BoxGeometry(0.82, 0.82, 0.09),
      [navy, navy, navy, navy, new THREE.MeshBasicMaterial({ map: pTex }), navy]
    );
    board.position.y = 1.58;
    signGroup.add(post, board);
    signGroup.position.set(4.75, 0.22, 0.55);
    signGroup.rotation.y = -0.05;
    world.add(signGroup);

    // Scanner gate
    const scanner = new THREE.Group();
    const scannerLightMat = new THREE.MeshStandardMaterial({ color: 0xffa375, emissive: 0xF26522, emissiveIntensity: 2.6 });
    [-1.38, 1.38].forEach((x) => {
      const p = new THREE.Mesh(new THREE.BoxGeometry(0.18, 2.05, 0.3), navy);
      p.position.set(x, 1.03, 0);
      p.castShadow = true;
      scanner.add(p);
    });
    const sTop = new THREE.Mesh(new THREE.BoxGeometry(2.94, 0.24, 0.38), navy);
    sTop.position.y = 2.08;
    sTop.castShadow = true;
    scanner.add(sTop);
    [-1.38, 1.38].forEach((x) => {
      const strip = new THREE.Mesh(new THREE.BoxGeometry(0.03, 1.5, 0.315), scannerLightMat);
      strip.position.set(x + (x < 0 ? 0.1 : -0.1), 1.03, 0);
      scanner.add(strip);
    });
    const scanMat = new THREE.MeshBasicMaterial({
      color: 0xF26522,
      transparent: true,
      opacity: 0.22,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const scanPlane = new THREE.Mesh(new THREE.PlaneGeometry(2.45, 1.35), scanMat);
    scanPlane.rotation.x = -Math.PI / 2;
    scanPlane.position.y = 0.58;
    scanner.add(scanPlane);
    scanner.position.set(2.77, 0.22, 2.25);
    world.add(scanner);

    // Barrier gate
    const gate = new THREE.Group();
    const gPost = new THREE.Mesh(new THREE.BoxGeometry(0.32, 1.25, 0.38), curbMat);
    gPost.position.y = 0.63;
    gPost.castShadow = true;
    gate.add(gPost);
    const gLens = new THREE.Mesh(new THREE.SphereGeometry(0.075, 18, 12), scannerLightMat);
    gLens.position.set(0, 1.08, 0.2);
    gate.add(gLens);
    const gatePivot = new THREE.Group();
    gatePivot.position.set(0.04, 1.02, 0);
    const gArm = new THREE.Mesh(new THREE.BoxGeometry(2.55, 0.11, 0.12), curbMat);
    gArm.position.x = 1.27;
    gArm.castShadow = true;
    gatePivot.add(gArm);
    [0.48, 1.12, 1.76, 2.38].forEach((x) => {
      const s = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.116, 0.126), orange);
      s.position.x = x;
      gatePivot.add(s);
    });
    gate.add(gatePivot);
    gate.position.set(1.36, 0.22, 3.75);
    world.add(gate);

    // Kiosk
    const kiosk = new THREE.Group();
    const kBod = new THREE.Mesh(new THREE.BoxGeometry(0.52, 1.18, 0.46), navy);
    kBod.position.y = 0.59;
    kBod.castShadow = true;
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.31, 0.28), new THREE.MeshBasicMaterial({ color: 0xF26522 }));
    scr.position.set(0, 0.79, 0.236);
    kiosk.add(kBod, scr);
    kiosk.position.set(4.22, 0.22, 3.42);
    world.add(kiosk);

    // Moving car
    const movingCar = createCar(0xF26522);
    movingCar.rotation.y = Math.PI;
    movingCar.position.set(2.77, 0.24, 8.55);
    world.add(movingCar);

    // Trees + planters
    [
      [-5.18, 2.95, 0.9],
      [-5.18, 0.6, 0.78],
      [5.15, -2.8, 0.9],
      [5.18, 2.15, 0.72],
    ].forEach(([x, z, s]) => {
      const pl = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.4, 0.3, 12), planterMat);
      pl.position.set(x, 0.31, z);
      pl.castShadow = true;
      world.add(pl);
      addTree(world, x, z, s);
    });

    // Bollards
    const bollardGeo = new THREE.CylinderGeometry(0.055, 0.065, 0.46, 12);
    [0.82, 4.72].forEach((x) => {
      [4.25, 5.25].forEach((z) => {
        const b = new THREE.Mesh(bollardGeo, curbMat);
        b.position.set(x, 0.45, z);
        b.castShadow = true;
        world.add(b);
      });
    });

    // State
    let pointerX = 0, pointerY = 0, currentX = 0, currentY = 0, frame = 0;
    const clock = new THREE.Clock();

    // Resize
    const resize = () => {
      const { clientWidth: w, clientHeight: h } = mount;
      if (!w || !h) return;
      camera.aspect = w / h;
      camera.fov = w < 560 ? 41 : 34;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    };
    const ro = new ResizeObserver(resize);
    ro.observe(mount);
    resize();

    // Pointer interaction
    const onMove = (e) => {
      const r = mount.getBoundingClientRect();
      pointerX = ((e.clientX - r.left) / r.width - 0.5) * 2;
      pointerY = ((e.clientY - r.top) / r.height - 0.5) * 2;
    };
    const onLeave = () => { pointerX = 0; pointerY = 0; };
    mount.addEventListener("pointermove", onMove);
    mount.addEventListener("pointerleave", onLeave);

    // Animate
    const animate = () => {
      frame = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      const cycle = reducedMotion ? 5.8 : (t * 0.7) % 9;
      const dist = Math.min(cycle, 5.85);

      // Moving car
      movingCar.position.z = 8.55 - dist;
      const wheels = movingCar.userData.wheels;
      if (cycle < 5.85 && !reducedMotion) {
        wheels.forEach((w) => { w.rotation.x -= 0.035; });
      }

      // Gate open/close
      const openGate = 1 - THREE.MathUtils.smoothstep(movingCar.position.z, 3.85, 5.35);
      gatePivot.rotation.z = openGate * Math.PI * 0.43;

      // Scanner pulse
      scanPlane.position.y = reducedMotion ? 0.7 : 0.43 + (Math.sin(t * 2.8) + 1) * 0.55;
      scanMat.opacity = reducedMotion ? 0.14 : 0.12 + (Math.sin(t * 3.2) + 1) * 0.045;
      scannerLightMat.emissiveIntensity = reducedMotion ? 2 : 2.2 + Math.sin(t * 4) * 0.7;
      arrow.position.y = 0.266 + (reducedMotion ? 0 : Math.sin(t * 2.4) * 0.012);

      // Camera orbit
      currentX += (pointerX - currentX) * 0.035;
      currentY += (pointerY - currentY) * 0.035;
      world.rotation.y = currentX * 0.035;
      world.rotation.x = currentY * 0.012;
      camera.position.x = 10.8 + currentX * 0.7;
      camera.position.y = 8.9 - currentY * 0.25;
      camera.lookAt(0, 0.1, 1.1);

      renderer.render(scene, camera);
    };
    animate();
    setReady(true);

    // Cleanup
    return () => {
      cancelAnimationFrame(frame);
      ro.disconnect();
      mount.removeEventListener("pointermove", onMove);
      mount.removeEventListener("pointerleave", onLeave);
      scene.traverse((obj) => {
        if (!(obj instanceof THREE.Mesh)) return;
        obj.geometry?.dispose();
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        mats.forEach((m) => { if (m.map) m.map.dispose(); m.dispose(); });
      });
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return (
    <div className="parking-model">
      <div className={`model-loader ${ready ? "model-loader--hidden" : ""}`}>
        <span /> Building 3D scene…
      </div>
      <div ref={mountRef} className="parking-model__canvas" />
      <div className="parking-model__hint" aria-hidden="true">
        <IconScan /> Move cursor to explore
      </div>
    </div>
  );
}

// ── MAIN APP ───────────────────────────────────────────────────────────
export default function App() {
  const BASE_API = import.meta.env.VITE_BASE_API_URL;
  console.log("Login BASE_API =", BASE_API);

  const [form, setForm] = useState({ email_or_mobile: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${BASE_API}/auth/dj-rest-auth/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.non_field_errors?.[0] || data?.detail || "Invalid login credentials.");
        return;
      }
      if (data.access) localStorage.setItem("access", data.access);
      if (data.refresh) localStorage.setItem("refresh", data.refresh);
      window.dispatchEvent(new Event("authChange"));
      window.location.href = "/dashboard";
    } catch {
      setError("Unable to connect to server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = () => {
    // Redirect to backend Google OAuth Endpoint
    window.location.href = `${BASE_API}/auth/google/login/`;
  };

  const handleRegisterRedirect = () => {
    window.location.href = "/register";
  };

  return (
    <>
      {/* ══════════ ALL STYLES ══════════ */}
      <style>{`
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@500;600;700;800&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { min-width: 320px; background: #f8f9fa; }
body { font-family: 'DM Sans', system-ui, sans-serif; min-height: 100vh; color: #0F4C81; }
button, input { font: inherit; }

.login-shell {
  display: grid; min-height: 100vh;
  grid-template-columns: minmax(0, 1.45fr) minmax(430px, 0.85fr);
  overflow: hidden; background: #f8f9fa;
}

.brand { display: inline-flex; align-items: center; gap: 12px; color: #0F4C81; text-decoration: none; }
.brand__mark {
  position: relative; display: flex; align-items: center; justify-content: center;
  width: 44px; height: 44px; overflow: hidden; border-radius: 8px;
}
.brand__copy { display: flex; flex-direction: column; }
.brand__copy strong {
  font-family: 'Manrope', sans-serif; font-size: 24px; font-weight: 800;
  line-height: 1; letter-spacing: .02em; color: #F26522;
}
.brand__copy small {
  margin-top: 4px; color: #0F4C81; font-size: 8px; font-weight: 800;
  line-height: 1; letter-spacing: .06em; text-transform: uppercase;
}
.brand--inverse .brand__copy strong { color: #F26522; }
.brand--inverse .brand__copy small { color: #ffffff; opacity: 0.9; }

.visual-panel {
  position: relative; display: flex; min-height: 100vh; flex-direction: column;
  overflow: hidden; color: #ffffff;
  background:
    radial-gradient(circle at 77% 37%, rgba(242,101,34,.15), transparent 30%),
    radial-gradient(circle at 10% 98%, rgba(15,76,129,.3), transparent 31%),
    linear-gradient(145deg, #071c30 0%, #0F4C81 51%, #0a2540 100%);
}
.visual-panel::after {
  position: absolute; right: 7%; bottom: 8%; width: 330px; height: 330px;
  border: 1px solid rgba(242,101,34,.15); border-radius: 50%; content: '';
  box-shadow: 0 0 0 70px rgba(242,101,34,.03), 0 0 0 145px rgba(242,101,34,.015);
  pointer-events: none;
}
.visual-panel__grid {
  position: absolute; inset: 0; opacity: .18;
  background-image:
    linear-gradient(rgba(255,255,255,.08) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,.08) 1px, transparent 1px);
  background-size: 72px 72px;
  -webkit-mask-image: linear-gradient(to bottom, black, transparent 73%);
  mask-image: linear-gradient(to bottom, black, transparent 73%);
}
.visual-panel__header {
  position: relative; z-index: 3; display: flex; align-items: center;
  justify-content: space-between; padding: 34px 42px 0;
  animation: reveal-down .65s ease both;
}
.system-status {
  display: inline-flex; align-items: center; gap: 8px;
  color: rgba(255,255,255,.75); font-size: 10px; font-weight: 700;
  letter-spacing: .12em; text-transform: uppercase;
}
.system-status i {
  display: block; width: 7px; height: 7px; border-radius: 50%;
  background: #F26522; box-shadow: 0 0 0 5px rgba(242,101,34,.25);
  animation: status-pulse 2s ease-in-out infinite;
}
.visual-panel__copy {
  position: relative; z-index: 3; width: min(660px, 78%);
  padding: clamp(42px, 7vh, 78px) 42px 0;
  animation: reveal-up .8s .08s ease both;
}
.eyebrow {
  margin: 0 0 16px; color: #F26522; font-size: 10px; font-weight: 800;
  letter-spacing: .19em; text-transform: uppercase;
}
.visual-panel__copy h1 {
  max-width: 610px; margin: 0; color: #ffffff;
  font-family: 'Manrope', sans-serif; font-size: clamp(42px, 4.2vw, 68px);
  font-weight: 700; line-height: 1.02; letter-spacing: -.035em;
}
.visual-panel__copy h1 span {
  display: block; margin-top: 10px; color: #F26522; font-size: .38em;
  font-weight: 800; line-height: 1; letter-spacing: .18em;
}
.visual-panel__copy > p:last-child {
  max-width: 510px; margin: 19px 0 0;
  color: rgba(255,255,255,.75); font-size: 14px; line-height: 1.65;
}
.feature-chips {
  position: relative; z-index: 3; display: flex; gap: 16px;
  padding: 18px 42px 0; flex-wrap: wrap;
  animation: reveal-up .9s .15s ease both;
}
.feature-chip {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 6px 12px; border-radius: 20px;
  background: rgba(255,255,255,.08); border: 1px solid rgba(255,255,255,.15);
  color: rgba(255,255,255,.88); font-size: 11px; font-weight: 600; letter-spacing: .03em;
}
.feature-chip svg { color: #F26522; }

.parking-model {
  position: relative; z-index: 2; flex: 1; min-height: 390px; margin-top: -28px;
  overflow: hidden;
  animation: model-arrive 1.1s .18s cubic-bezier(.22,1,.36,1) both;
}
.parking-model__canvas { position: absolute; inset: 0; cursor: grab; }
.parking-model__canvas:active { cursor: grabbing; }
.parking-model__canvas canvas { display: block; width: 100%; height: 100%; }
.parking-model__hint {
  position: absolute; right: 38px; bottom: 25px;
  display: inline-flex; align-items: center; gap: 8px;
  color: rgba(255,255,255,.5); font-size: 10px; font-weight: 600;
  letter-spacing: .08em; text-transform: uppercase; pointer-events: none;
}
.model-loader {
  position: absolute; inset: 0; z-index: 4; display: flex;
  align-items: center; justify-content: center; gap: 10px;
  color: rgba(255,255,255,.6); font-size: 10px; font-weight: 700;
  letter-spacing: .12em; text-transform: uppercase;
  transition: opacity .35s ease, visibility .35s ease;
}
.model-loader span {
  width: 14px; height: 14px; border: 2px solid rgba(242,101,34,.3);
  border-top-color: #F26522; border-radius: 50%;
  animation: spin .8s linear infinite;
}
.model-loader--hidden { visibility: hidden; opacity: 0; }

.auth-panel {
  position: relative; z-index: 5; display: flex; min-height: 100vh;
  flex-direction: column; border-left: 1px solid rgba(15,76,129,.1);
  background: radial-gradient(circle at 90% 0%, rgba(242,101,34,.05), transparent 25%), #ffffff;
}
.auth-panel__top {
  display: flex; align-items: center; justify-content: flex-end;
  padding: 34px 40px; animation: reveal-down .65s ease both;
}
.auth-panel__top .brand { display: none; }
.auth-panel__top > a {
  color: #0F4C81; font-size: 12px; font-weight: 600; text-decoration: none;
  transition: color .2s ease;
}
.auth-panel__top > a:hover { color: #F26522; }
.auth-panel__content {
  width: min(100% - 64px, 410px); margin: auto; padding: 28px 0 54px;
  animation: reveal-up .8s .14s ease both;
}
.auth-intro__icon {
  display: grid; width: 42px; height: 42px; margin-bottom: 24px;
  place-items: center; border: 1px solid rgba(242,101,34,.2);
  border-radius: 50%; color: #F26522; background: #fff5f0;
}
.auth-intro h2 {
  margin: 0; color: #0F4C81; font-family: 'Manrope', sans-serif;
  font-size: 34px; font-weight: 700; line-height: 1.1; letter-spacing: -.045em;
}
.auth-intro p { margin: 10px 0 0; color: #5c7285; font-size: 14px; }

.login-form { display: flex; margin-top: 32px; flex-direction: column; gap: 18px; }
.field { display: flex; flex-direction: column; gap: 9px; }
.field > span:first-child { color: #0F4C81; font-size: 11px; font-weight: 700; letter-spacing: .035em; }
.field__control { position: relative; display: flex; align-items: center; }
.field__control > svg {
  position: absolute; left: 15px; color: #8a9ba8; pointer-events: none;
  transition: color .2s ease;
}
.field__control:focus-within > svg { color: #F26522; }
.field input {
  width: 100%; height: 52px; padding: 0 47px 0 45px;
  border: 1px solid #d0d7de; border-radius: 10px; background: #ffffff;
  color: #0F4C81; font-size: 14px; font-weight: 500; outline: none;
  transition: border-color .2s ease, box-shadow .2s ease;
}
.field input:focus {
  border-color: #F26522;
  box-shadow: 0 0 0 4px rgba(242,101,34,.12);
}
.field__toggle {
  position: absolute; right: 12px; display: flex; align-items: center;
  justify-content: center; width: 32px; height: 32px; border: none;
  background: transparent; color: #8a9ba8; cursor: pointer; border-radius: 6px;
  transition: color .2s ease;
}
.field__toggle:hover { color: #0F4C81; }

.form-actions { display: flex; align-items: center; justify-content: flex-end; margin-top: -4px; }
.form-actions a { color: #F26522; font-size: 12px; font-weight: 600; text-decoration: none; }
.form-actions a:hover { text-decoration: underline; }

.btn-primary {
  display: flex; align-items: center; justify-content: center; gap: 10px;
  width: 100%; height: 52px; border: none; border-radius: 10px;
  background: #F26522; color: #ffffff; font-family: 'Manrope', sans-serif;
  font-size: 15px; font-weight: 700; cursor: pointer;
  box-shadow: 0 4px 12px rgba(242,101,34,.25);
  transition: background .2s ease, transform .1s ease, box-shadow .2s ease;
}
.btn-primary:hover { background: #e05411; box-shadow: 0 6px 16px rgba(242,101,34,.35); }
.btn-primary:active { transform: scale(.98); }
.btn-primary:disabled { opacity: .65; cursor: not-allowed; }

.divider {
  display: flex; align-items: center; gap: 12px; margin: 6px 0;
  color: #8a9ba8; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: .05em;
}
.divider::before, .divider::after {
  content: ''; flex: 1; height: 1px; background: #e2e8f0;
}

.btn-secondary {
  display: flex; align-items: center; justify-content: center; gap: 10px;
  width: 100%; height: 48px; border: 1px solid #d0d7de; border-radius: 10px;
  background: #ffffff; color: #0F4C81; font-family: 'DM Sans', sans-serif;
  font-size: 14px; font-weight: 600; cursor: pointer;
  transition: background .2s ease, border-color .2s ease, color .2s ease;
}
.btn-secondary:hover { background: #f8fafc; border-color: #0F4C81; }

.btn-outline {
  display: flex; align-items: center; justify-content: center; gap: 10px;
  width: 100%; height: 48px; border: 1px solid rgba(15, 76, 129, 0.2); border-radius: 10px;
  background: rgba(15, 76, 129, 0.03); color: #0F4C81; font-family: 'DM Sans', sans-serif;
  font-size: 14px; font-weight: 600; cursor: pointer;
  transition: background .2s ease, border-color .2s ease;
}
.btn-outline:hover { background: rgba(15, 76, 129, 0.08); border-color: #0F4C81; }

.error-banner {
  padding: 12px 14px; border-radius: 8px; background: #fff1f0;
  border: 1px solid #ffa39e; color: #d9363e; font-size: 13px; font-weight: 500;
}

@keyframes spin { to { transform: rotate(360deg); } }
@keyframes status-pulse { 0%, 100% { opacity: 1; } 50% { opacity: .4; } }
@keyframes reveal-down { from { opacity: 0; transform: translateY(-12px); } to { opacity: 1; transform: translateY(0); } }
@keyframes reveal-up { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
@keyframes model-arrive { from { opacity: 0; transform: scale(.95); } to { opacity: 1; transform: scale(1); } }

@media (max-width: 980px) {
  .login-shell { grid-template-columns: 1fr; }
  .visual-panel { min-height: 480px; }
  .auth-panel { border-left: none; }
  .auth-panel__top .brand { display: inline-flex; }
}
      `}</style>

      {/* ══════════ MAIN HTML STRUCTURE ══════════ */}
      <div className="login-shell">
        {/* LEFT 3D VISUAL PANEL */}
        <section className="visual-panel">
          <div className="visual-panel__grid" aria-hidden="true" />
          <header className="visual-panel__header">
            <Brand inverse />
            <span className="system-status">
              <i /> Live System
            </span>
          </header>

          <div className="visual-panel__copy">
            <p className="eyebrow">Smart Automated Parking</p>
            <h1>
              Elevating Modern
              <span>PARKING INFRASTRUCTURE</span>
            </h1>
            <p>
              Experience seamless multi-level automated vehicle management, real-time telemetry, and secure touchless access control.
            </p>
          </div>

          <div className="feature-chips">
            <span className="feature-chip">
              <IconShield /> High Security
            </span>
            <span className="feature-chip">
              <IconLayers /> Multi-Level Stack
            </span>
            <span className="feature-chip">
              <IconCheckCircle /> Automated Entry
            </span>
          </div>

          {/* Interactive 3D Model */}
          <ParkingModel />
        </section>

        {/* RIGHT AUTH FORM PANEL */}
        <main className="auth-panel">
          <header className="auth-panel__top">
            <Brand />
            <a href="#help">Need Support?</a>
          </header>

          <div className="auth-panel__content">
            <div className="auth-intro">
              <div className="auth-intro__icon">
                <IconShield />
              </div>
              <h2>Welcome back</h2>
              <p>Sign in to your account or register to access the smart parking terminal dashboard.</p>
            </div>

            <form className="login-form" onSubmit={handleSubmit}>
              {error && <div className="error-banner">{error}</div>}

              <label className="field">
                <span>Email or Mobile Number</span>
                <div className="field__control">
                  <IconMail />
                  <input
                    type="text"
                    required
                    placeholder="name@company.com or phone"
                    value={form.email_or_mobile}
                    onChange={(e) => setForm({ ...form, email_or_mobile: e.target.value })}
                  />
                </div>
              </label>

              <label className="field">
                <span>Password</span>
                <div className="field__control">
                  <IconLock />
                  <input
                    type={showPass ? "text" : "password"}
                    required
                    placeholder="••••••••••••"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                  />
                  <button
                    type="button"
                    className="field__toggle"
                    onClick={() => setShowPass(!showPass)}
                    aria-label={showPass ? "Hide password" : "Show password"}
                  >
                    {showPass ? <IconEyeOff /> : <IconEye />}
                  </button>
                </div>
              </label>

              <div className="form-actions">
                <a href="#forgot-password">Forgot password?</a>
              </div>

              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? "Signing in…" : "Sign In"}
                {!loading && <IconArrowRight />}
              </button>

              <div className="divider">Or continue with</div>

              {/* Google Sign Up / Login Button */}
              <button type="button" className="btn-secondary" onClick={handleGoogleSignup}>
                <IconGoogle /> Sign up with Google
              </button>

              
            </form>
          </div>
        </main>
      </div>
    </>
  );
}