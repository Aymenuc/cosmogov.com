import * as THREE from "three";
import {
  GOALS,
  TILES,
  stepParty,
  type PartyState,
  type Input,
} from "@/lib/games/block-party";

export function mountPartyScene(
  host: HTMLElement,
  state: PartyState,
  control: { active: boolean; inputs: Input[]; reduced: boolean },
  report: () => void,
  failed: () => void,
) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#c8e9ee");
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.domElement.setAttribute("aria-hidden", "true");
  host.appendChild(renderer.domElement);
  const camera = new THREE.OrthographicCamera(-13, 13, 10, -10, 0.1, 120);
  camera.position.set(0, 20, 23);
  camera.lookAt(0, 0.3, -0.5);
  scene.add(new THREE.HemisphereLight("#fff9e5", "#8275b4", 1.8));
  const sun = new THREE.DirectionalLight("#fff0cc", 2.1);
  sun.position.set(-10, 22, 12);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = -18;
  sun.shadow.camera.right = 18;
  sun.shadow.camera.top = 16;
  sun.shadow.camera.bottom = -16;
  sun.shadow.normalBias = 0.04;
  scene.add(sun);
  const materials: THREE.Material[] = [],
    geometries: THREE.BufferGeometry[] = [],
    textures: THREE.Texture[] = [];
  const material = (color: string) => {
    const m = new THREE.MeshStandardMaterial({ color, roughness: 0.65 });
    materials.push(m);
    return m;
  };
  const mat = {
    mint: material("#54dcb1"),
    purple: material("#a392f2"),
    pink: material("#ff789f"),
    gold: material("#ffd453"),
    blue: material("#4674ed"),
    cream: material("#fff9dc"),
    dark: material("#293c58"),
    orange: material("#ff9d63"),
    green: material("#51bd94"),
  };
  const mesh = (
    g: THREE.BufferGeometry,
    m: THREE.Material,
    x: number,
    y: number,
    z: number,
    parent: THREE.Object3D = scene,
  ) => {
    geometries.push(g);
    const o = new THREE.Mesh(g, m);
    o.position.set(x, y, z);
    o.castShadow = true;
    o.receiveShadow = true;
    parent.add(o);
    return o;
  };
  const box = (
    w: number,
    h: number,
    d: number,
    m: THREE.Material,
    x: number,
    y: number,
    z: number,
    parent = scene as THREE.Object3D,
  ) => mesh(new THREE.BoxGeometry(w, h, d), m, x, y, z, parent);
  const sphere = (
    r: number,
    m: THREE.Material,
    x: number,
    y: number,
    z: number,
    parent = scene as THREE.Object3D,
  ) => mesh(new THREE.SphereGeometry(r, 20, 16), m, x, y, z, parent);
  function label(text: string, x: number, y: number, z: number, width = 3) {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#fff9ed";
    ctx.beginPath();
    ctx.roundRect(0, 0, 512, 128, 28);
    ctx.fill();
    ctx.fillStyle = "#293c58";
    ctx.font = "bold 54px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, 256, 67);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    textures.push(texture);
    const m = new THREE.SpriteMaterial({ map: texture, toneMapped: false });
    materials.push(m);
    const sprite = new THREE.Sprite(m);
    sprite.position.set(x, y, z);
    sprite.scale.set(width, width / 4, 1);
    scene.add(sprite);
    return sprite;
  }
  // A handcrafted toy neighbourhood: all geometry is original and generated locally.
  box(25, 0.6, 19, mat.mint, 0, -3.4, 0);
  for (let i = 0; i < 7; i++) {
    const x = (i - 3) * 3.6,
      h = 2 + (i % 3) * 0.6;
    box(
      2.7,
      h,
      2,
      [mat.pink, mat.purple, mat.orange, mat.blue][i % 4],
      x,
      h / 2 - 0.3,
      -8.8,
    );
    box(2.95, 0.25, 2.3, mat.cream, x, h - 0.2, -8.8);
    for (const dx of [-0.65, 0.65])
      box(0.5, 0.6, 0.07, mat.cream, x + dx, h - 1, -7.76);
    box(0.5, 0.85, 0.08, mat.dark, x, 0.1, -7.75);
    const tree = sphere(0.75, mat.green, x + 1.5, 1.1, -6.8);
    tree.scale.y = 1.3;
    box(0.18, 1.2, 0.18, mat.orange, x + 1.5, 0.1, -6.8);
  }
  // Bunting draped above the skyline.
  for (let i = 0; i < 18; i++) {
    const x = -11 + i * 1.3,
      y = 5.8 - Math.sin((i / 17) * Math.PI) * 1.5;
    const flag = mesh(
      new THREE.ConeGeometry(0.28, 0.55, 3),
      i % 2 ? mat.gold : mat.pink,
      x,
      y,
      -8,
    );
    flag.rotation.z = Math.PI;
  }
  if (state.game === "rally") {
    for (const [i, t] of TILES.entries()) {
      box(3.35, 0.65, 3.35, i % 2 ? mat.purple : mat.mint, t.x, -0.35, t.z);
      box(3.1, 0.07, 3.1, mat.cream, t.x, -0.015, t.z);
      box(2.8, 1.4, 2.8, i % 2 ? mat.blue : mat.pink, t.x, -1.35, t.z);
      box(0.5, 0.45, 0.06, mat.cream, t.x, -1.3, t.z + 1.42);
    }
  } else {
    box(19.5, 0.7, 13, mat.purple, 0, -0.4, 0);
    box(18.8, 0.06, 12.3, mat.cream, 0, -0.02, 0);
    for (const z of [-6.35, 6.35]) box(19.5, 0.5, 0.22, mat.pink, 0, 0.2, z);
    for (const x of [-9.65, 9.65]) box(0.22, 0.5, 13, mat.pink, x, 0.2, 0);
    for (let x = -8; x <= 8; x += 2)
      for (let z = -4; z <= 4; z += 2) {
        mesh(
          new THREE.CircleGeometry(0.055, 8),
          mat.purple,
          x,
          0.03,
          z,
        ).rotation.x = -Math.PI / 2;
      }
  }
  const ringMeshes = state.rings.map((r) =>
    mesh(new THREE.TorusGeometry(0.43, 0.13, 10, 24), mat.gold, r.x, 1.2, r.z),
  );
  if (state.game !== "rally")
    ringMeshes.forEach((r) => {
      r.visible = false;
    });
  const sweepers: THREE.Group[] = [];
  for (const x of state.game === "rally" ? [-4, 4] : [0]) {
    const group = new THREE.Group();
    group.position.set(x, 0.38, 0);
    scene.add(group);
    const length = state.game === "rally" ? 3.6 : 7.6;
    box(length, 0.3, 0.3, mat.pink, 0, 0, 0, group);
    for (const end of [-1, 1])
      sphere(0.3, mat.cream, (end * length) / 2, 0, 0, group);
    mesh(new THREE.CylinderGeometry(0.4, 0.5, 0.65, 20), mat.gold, x, 0.35, 0);
    sweepers.push(group);
  }
  const playerMeshes = state.players.map((_, i) => {
    const g = new THREE.Group();
    scene.add(g);
    const body = mesh(
      new THREE.CapsuleGeometry(0.34, 0.4, 6, 16),
      i ? mat.orange : mat.blue,
      0,
      0.7,
      0,
      g,
    );
    body.rotation.z = i ? -0.05 : 0.05;
    sphere(0.31, mat.cream, 0, 1.19, 0.08, g);
    for (const dx of [-0.11, 0.11]) sphere(0.055, mat.dark, dx, 1.23, 0.36, g);
    mesh(
      new THREE.TorusGeometry(0.13, 0.025, 6, 12, Math.PI),
      mat.dark,
      0,
      1.1,
      0.37,
      g,
    ).rotation.z = Math.PI;
    sphere(0.36, i ? mat.orange : mat.blue, 0, 1.45, 0, g).scale.y = 0.45;
    for (const dx of [-0.2, 0.2])
      sphere(0.18, mat.dark, dx, 0.14, 0.1, g).scale.z = 1.3;
    for (const dx of [-0.43, 0.43])
      sphere(0.16, i ? mat.orange : mat.blue, dx, 0.72, 0, g);
    const shadow = mesh(
      new THREE.CircleGeometry(0.45, 24),
      material("#7f85a9"),
      0,
      0.04,
      0,
    );
    shadow.rotation.x = -Math.PI / 2;
    return {
      g,
      shadow,
      tag: label(i ? "P2 · MANGO" : "P1 · BLUEBERRY", 0, 2, 0, 2.6),
    };
  });
  const ball = sphere(0.7, mat.gold, 0, 0.7, 1);
  ball.visible = state.game === "bumpers";
  const belt = mesh(
    new THREE.TorusGeometry(0.7, 0.045, 8, 24),
    mat.pink,
    0,
    0,
    0,
    ball,
  );
  belt.rotation.x = Math.PI / 2;
  const goal = mesh(
    new THREE.TorusGeometry(1.35, 0.15, 12, 40),
    mat.green,
    0,
    0.12,
    0,
  );
  goal.rotation.x = -Math.PI / 2;
  goal.visible = ball.visible;
  const goalLabel = label("GOAL", 0, 1.4, 0, 1.7);
  goalLabel.visible = ball.visible;
  const sparks = Array.from({ length: 22 }, (_, i) => {
    const o = box(
      0.12,
      0.12,
      0.12,
      [mat.pink, mat.gold, mat.green][i % 3],
      0,
      -10,
      0,
    );
    return o;
  });
  let effectTime = -10,
    event = state.event,
    frame = 0,
    last = performance.now(),
    accumulator = 0,
    lastReport = 0,
    disposed = false;
  const resize = () => {
    const { width, height } = host.getBoundingClientRect();
    const aspect = Math.max(1, width) / Math.max(1, height);
    const halfH = Math.max(10.2, 12.8 / aspect);
    camera.left = -halfH * aspect;
    camera.right = halfH * aspect;
    camera.top = halfH;
    camera.bottom = -halfH;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  };
  const observer = new ResizeObserver(resize);
  observer.observe(host);
  resize();
  const contextLost = (e: Event) => {
    e.preventDefault();
    control.active = false;
    failed();
  };
  renderer.domElement.addEventListener("webglcontextlost", contextLost);
  function animate(now: number) {
    if (disposed) return;
    const delta = Math.min((now - last) / 1000, 0.1);
    last = now;
    if (control.active) {
      accumulator += delta;
      while (accumulator >= 1 / 120) {
        stepParty(state, control.inputs, 1 / 120);
        accumulator -= 1 / 120;
      }
    } else accumulator = 0;
    const t = state.elapsed;
    if (event !== state.event) {
      event = state.event;
      effectTime = t;
    }
    playerMeshes.forEach(({ g, shadow, tag }, i) => {
      const p = state.players[i];
      g.position.set(p.x, p.y, p.z);
      g.rotation.y = Math.atan2(p.dx, p.dz);
      if (!control.reduced)
        g.scale.set(
          1 + (p.dash > 0 ? 0.15 : 0),
          1 - (p.dash > 0 ? 0.12 : 0),
          1,
        );
      shadow.position.set(p.x, 0.04, p.z);
      shadow.visible =
        p.y >= 0 &&
        (state.game === "bumpers" ||
          TILES.some(
            (tile) =>
              Math.abs(tile.x - p.x) < 1.65 && Math.abs(tile.z - p.z) < 1.65,
          ));
      tag.position.set(p.x, p.y + 2.05, p.z);
    });
    ringMeshes.forEach((r, i) => {
      r.visible = state.game === "rally" && !state.rings[i].taken;
      if (!control.reduced) {
        r.rotation.y = t * 1.5;
        r.position.y = 1.1 + Math.sin(t * 3 + i) * 0.12;
      }
    });
    sweepers.forEach((g) => {
      g.rotation.y = -(t * (state.game === "rally" ? 1.4 : 0.85) + state.seed);
    });
    ball.position.set(state.ball.x, 0.7, state.ball.z);
    ball.rotation.x = state.ball.z;
    ball.rotation.z = -state.ball.x;
    const target = GOALS[state.goal];
    goal.position.set(target.x, 0.12, target.z);
    goalLabel.position.set(target.x, 1.4, target.z);
    sparks.forEach((o, i) => {
      const age = t - effectTime;
      o.visible = !control.reduced && age < 0.7 && state.event > 0;
      const centre =
        state.game === "rally"
          ? state.players[Math.max(0, state.lastCollector)]
          : state.ball;
      o.position.set(
        centre.x + Math.cos(i * 2.4) * age * 4,
        1.5 + age * 4 - age * age * 7,
        centre.z + Math.sin(i * 2.4) * age * 4,
      );
      o.rotation.set(t, i + t, t * 2);
    });
    renderer.render(scene, camera);
    if (now - lastReport > 100) {
      report();
      lastReport = now;
    }
    frame = requestAnimationFrame(animate);
  }
  frame = requestAnimationFrame(animate);
  return () => {
    disposed = true;
    cancelAnimationFrame(frame);
    observer.disconnect();
    renderer.domElement.removeEventListener("webglcontextlost", contextLost);
    geometries.forEach((g) => g.dispose());
    materials.forEach((m) => m.dispose());
    textures.forEach((t) => t.dispose());
    renderer.dispose();
    renderer.forceContextLoss();
    renderer.domElement.remove();
  };
}
