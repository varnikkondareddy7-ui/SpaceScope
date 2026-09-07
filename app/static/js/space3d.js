
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

if (window.__space3dTimer) clearTimeout(window.__space3dTimer);
const canvas = document.getElementById("spaceCanvas");
const loading = document.getElementById("sceneLoading");
const errorBox = document.getElementById("sceneError");
const errorText = document.getElementById("sceneErrorText");

function fail(message) {
  loading?.classList.add("hidden");
  if (errorText) errorText.textContent = message;
  errorBox?.classList.remove("hidden");
  console.error("SpaceScope 3D:", message);
}

if (!canvas) {
  throw new Error("3D canvas was not found.");
}

try {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x02040a);
  scene.fog = new THREE.FogExp2(0x02040a, 0.006);

  const camera = new THREE.PerspectiveCamera(
    50,
    Math.max(canvas.clientWidth, 1) / Math.max(canvas.clientHeight, 1),
    0.01,
    1000
  );
  camera.position.set(0, 10, 22);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    powerPreference: "high-performance"
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.minDistance = 1.4;
  controls.maxDistance = 120;

  scene.add(new THREE.AmbientLight(0x8da3cc, 0.8));
  const sunLight = new THREE.PointLight(0xffffff, 4.5, 300);
  sunLight.position.set(0, 0, 0);
  scene.add(sunLight);

  // Stars
  const starGeometry = new THREE.BufferGeometry();
  const starPositions = [];
  for (let i = 0; i < 4500; i++) {
    const r = 60 + Math.random() * 220;
    const theta = Math.random() * Math.PI * 2;
    const u = Math.random() * 2 - 1;
    const s = Math.sqrt(1 - u * u);
    starPositions.push(
      r * s * Math.cos(theta),
      r * u,
      r * s * Math.sin(theta)
    );
  }
  starGeometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(starPositions, 3)
  );
  scene.add(
    new THREE.Points(
      starGeometry,
      new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.075,
        transparent: true,
        opacity: 0.82,
        sizeAttenuation: true
      })
    )
  );

  function sphere(radius, color, emissive = null) {
    return new THREE.Mesh(
      new THREE.SphereGeometry(radius, 40, 28),
      new THREE.MeshStandardMaterial({
        color,
        emissive: emissive ?? 0x000000,
        emissiveIntensity: emissive ? 1.15 : 0,
        roughness: 0.72,
        metalness: 0.02
      })
    );
  }

  const bodies = {};

  const sun = sphere(1.0, 0xffb347, 0xff7600);
  scene.add(sun);
  bodies.Sun = sun;

  const planetDefs = [
    ["Mercury", 2.15, 0.18, 0x9d9388],
    ["Venus", 3.0, 0.29, 0xd8a35f],
    ["Earth", 4.0, 0.34, 0x2b79ff],
    ["Mars", 5.1, 0.26, 0xd85d3d],
    ["Jupiter", 8.0, 0.72, 0xcfa477],
    ["Saturn", 10.4, 0.62, 0xd8c08f],
    ["Uranus", 13.0, 0.48, 0x89d8db],
    ["Neptune", 15.5, 0.46, 0x406ee8]
  ];

  planetDefs.forEach(([name, radius, size, color]) => {
    const planet = sphere(size, color);
    planet.position.set(radius, 0, 0);
    planet.userData = { type: "planet", name };
    scene.add(planet);
    bodies[name] = planet;

    const points = [];
    for (let i = 0; i < 160; i++) {
      const a = (i / 160) * Math.PI * 2;
      points.push(new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius));
    }
    const orbitGeo = new THREE.BufferGeometry().setFromPoints(points);
    scene.add(
      new THREE.LineLoop(
        orbitGeo,
        new THREE.LineBasicMaterial({
          color: 0x253047,
          transparent: true,
          opacity: 0.65
        })
      )
    );

    if (name === "Saturn") {
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.82, 1.15, 72),
        new THREE.MeshBasicMaterial({
          color: 0xc8b47d,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.58
        })
      );
      ring.rotation.x = Math.PI / 2.15;
      planet.add(ring);
    }
  });

  const moon = sphere(0.095, 0xb7bcc5);
  moon.position.set(0.58, 0, 0);
  bodies.Earth.add(moon);

  // Labels using sprites.
  function makeLabel(text, color = "#d9e4ff") {
    const c = document.createElement("canvas");
    c.width = 512;
    c.height = 96;
    const ctx = c.getContext("2d");
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.font = "600 30px Inter, Arial";
    ctx.textAlign = "center";
    ctx.fillStyle = color;
    ctx.fillText(text, 256, 50);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(1.8, 0.34, 1);
    return sprite;
  }

  Object.entries(bodies).forEach(([name, body]) => {
    if (name === "Sun") return;
    const label = makeLabel(name);
    label.position.set(0, 0.6, 0);
    body.add(label);
  });

  const sunLabel = makeLabel("SUN", "#ffd166");
  sunLabel.position.set(0, 1.45, 0);
  scene.add(sunLabel);

  // Curated spacecraft markers.
  const clickable = [];
  const curatedMeshes = [];
  const filterState = {};
  document.querySelectorAll("[data-filter]").forEach(el => {
    filterState[el.dataset.filter] = el.checked;
  });

  function anchorFor(destination) {
    if (destination === "Earth") return bodies.Earth.position.clone();
    if (destination === "Moon") return bodies.Earth.position.clone().add(new THREE.Vector3(0.58, 0, 0));
    if (destination === "Mars") return bodies.Mars.position.clone();
    if (destination === "Jupiter") return bodies.Jupiter.position.clone();
    if (destination === "Sun") return bodies.Sun.position.clone();
    if (destination === "Asteroid") return new THREE.Vector3(6.1, 0.55, 1.05);
    return null;
  }

  const sceneData = await fetch("/api/scene").then(r => {
    if (!r.ok) throw new Error("Could not load spacecraft scene data.");
    return r.json();
  });

  sceneData.objects.forEach((o, idx) => {
    let pos;
    const anchor = anchorFor(o.destination);

    if (anchor) {
      const angle = (idx * 2.399) % (Math.PI * 2);
      const rr =
        o.destination === "Earth" ? 0.67 :
        o.destination === "Mars" ? 0.50 :
        o.destination === "Jupiter" ? 0.96 :
        o.destination === "Moon" ? 0.22 :
        0.42;

      pos = anchor.clone().add(
        new THREE.Vector3(
          Math.cos(angle) * rr,
          ((idx % 5) - 2) * 0.07,
          Math.sin(angle) * rr
        )
      );
    } else {
      pos = new THREE.Vector3(o.x || 0, o.y || 0, o.z || 0);
    }

    const color =
      o.destination === "Mars" ? 0xff7b57 :
      o.destination === "Jupiter" ? 0xa782ff :
      o.destination === "Deep Space" ? 0xc19cff :
      o.destination === "Sun" ? 0xffd166 :
      o.destination === "Moon" ? 0x9ff0d0 :
      0x65e7ff;

    const marker = new THREE.Mesh(
      new THREE.SphereGeometry(0.085, 16, 12),
      new THREE.MeshBasicMaterial({ color })
    );
    marker.position.copy(pos);
    marker.userData = { type: "curated", ...o };

    const halo = new THREE.Mesh(
      new THREE.RingGeometry(0.12, 0.16, 24),
      new THREE.MeshBasicMaterial({
        color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.32
      })
    );
    halo.rotation.x = Math.PI / 2;
    marker.add(halo);

    scene.add(marker);
    clickable.push(marker);
    curatedMeshes.push(marker);
  });

  function applyFilters() {
    curatedMeshes.forEach(mesh => {
      mesh.visible = filterState[mesh.userData.category] !== false;
    });
  }

  document.querySelectorAll("[data-filter]").forEach(el => {
    el.addEventListener("change", () => {
      filterState[el.dataset.filter] = el.checked;
      applyFilters();
    });
  });

  applyFilters();

  // Live Earth satellites.
  const satGroup = new THREE.Group();
  scene.add(satGroup);

  const satCount = document.getElementById("satCount");
  const satSelect = document.getElementById("satGroup");
  const liveToggle = document.getElementById("liveSatToggle");

  function keplerPosition(row, elapsedSeconds) {
    const mu = 398600.4418;
    const earthR = 6378.137;

    const mm = Number(row.MEAN_MOTION || 15);
    const n = mm * 2 * Math.PI / 86400;
    const a = Math.cbrt(mu / (n * n));
    const e = Math.max(0, Math.min(0.99, Number(row.ECCENTRICITY || 0)));
    const inc = THREE.MathUtils.degToRad(Number(row.INCLINATION || 0));
    const raan = THREE.MathUtils.degToRad(Number(row.RA_OF_ASC_NODE || 0));
    const argp = THREE.MathUtils.degToRad(Number(row.ARG_OF_PERICENTER || 0));
    const M0 = THREE.MathUtils.degToRad(Number(row.MEAN_ANOMALY || 0));

    const M = (M0 + n * elapsedSeconds) % (Math.PI * 2);

    let E = M;
    for (let i = 0; i < 6; i++) {
      E = E - (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
    }

    const nu = 2 * Math.atan2(
      Math.sqrt(1 + e) * Math.sin(E / 2),
      Math.sqrt(1 - e) * Math.cos(E / 2)
    );
    const r = a * (1 - e * Math.cos(E));
    const x = r * Math.cos(nu);
    const y = r * Math.sin(nu);

    const cw = Math.cos(argp), sw = Math.sin(argp);
    const cO = Math.cos(raan), sO = Math.sin(raan);
    const ci = Math.cos(inc), si = Math.sin(inc);

    const X = (cO*cw - sO*sw*ci)*x + (-cO*sw - sO*cw*ci)*y;
    const Y = (sO*cw + cO*sw*ci)*x + (-sO*sw + cO*cw*ci)*y;
    const Z = (sw*si)*x + (cw*si)*y;

    const scale = 0.34 / earthR;
    return new THREE.Vector3(X * scale, Z * scale, Y * scale);
  }

  async function loadSatellites() {
    if (!satSelect) return;
    satCount.textContent = "Loading orbital objects...";

    try {
      const response = await fetch(
        `/api/satellites?group=${encodeURIComponent(satSelect.value)}&limit=2500`
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Satellite data request failed.");

      satGroup.clear();

      const positions = [];
      const now = (Date.now() / 1000) % 86400;

      data.objects.forEach(row => {
        const p = keplerPosition(row, now).add(bodies.Earth.position);
        positions.push(p.x, p.y, p.z);
      });

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));

      const points = new THREE.Points(
        geometry,
        new THREE.PointsMaterial({
          color: 0x65e7ff,
          size: 0.04,
          transparent: true,
          opacity: 0.9,
          sizeAttenuation: true
        })
      );

      satGroup.add(points);
      satGroup.visible = liveToggle?.checked !== false;
      satCount.textContent = `${data.count.toLocaleString()} objects loaded`;
    } catch (err) {
      satCount.textContent = "Live catalog unavailable";
      console.warn(err);
    }
  }

  satSelect?.addEventListener("change", loadSatellites);
  liveToggle?.addEventListener("change", () => {
    satGroup.visible = liveToggle.checked;
  });

  loadSatellites();

  // Raycast clicks.
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const panel = document.getElementById("objectPanel");
  const panelName = document.getElementById("panelName");
  const panelKind = document.getElementById("panelKind");
  const panelMeta = document.getElementById("panelMeta");
  const panelLink = document.getElementById("panelLink");

  document.getElementById("panelClose")?.addEventListener("click", () => {
    panel.classList.add("hidden");
  });

  renderer.domElement.addEventListener("click", event => {
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(clickable, false);

    if (hits.length) {
      const d = hits[0].object.userData;
      panelName.textContent = d.name;
      panelKind.textContent = d.kind;
      panelMeta.textContent = `${d.destination} · ${d.status}`;
      panelLink.href = `/object/${d.slug}`;
      panel.classList.remove("hidden");
    }
  });

  const views = {
    solar: { pos: [0, 10, 22], target: [0, 0, 0] },
    earth: { pos: [4.0, 1.7, 3.6], target: [4.0, 0, 0] },
    mars: { pos: [5.1, 1.55, 3.0], target: [5.1, 0, 0] },
    jupiter: { pos: [8.0, 3.0, 5.8], target: [8.0, 0, 0] },
    deep: { pos: [7.0, 7.0, 17.0], target: [5.0, 0, 0] }
  };

  document.querySelectorAll(".view-btn").forEach(button => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".view-btn").forEach(x => x.classList.remove("active"));
      button.classList.add("active");

      const v = views[button.dataset.view];
      camera.position.set(...v.pos);
      controls.target.set(...v.target);
      controls.update();
    });
  });

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const width = Math.max(rect.width, 1);
    const height = Math.max(rect.height, 1);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  new ResizeObserver(resize).observe(canvas);
  resize();

  loading?.classList.add("hidden");

  function animate() {
    requestAnimationFrame(animate);
    sun.rotation.y += 0.0015;

    curatedMeshes.forEach((mesh, i) => {
      if (mesh.children[0]) mesh.children[0].rotation.z += 0.006 + i * 0.0001;
    });

    controls.update();
    renderer.render(scene, camera);
  }

  animate();
} catch (err) {
  fail(err?.message || String(err));
}
