/* Scroll-pinned "wipe to black" section with a real WebGL block scene.
   Client-facing purpose: proof that interactive, cursor-reactive 3D
   sections like this can be built directly into a site.

   Two parts:
   1. Scroll-linked wipe + text fade (plain DOM/CSS, no three.js needed).
   2. The three.js block scene, gated so it only accepts pointer input
      once the wipe has fully revealed it, and only renders while the
      section is actually on screen. */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const wrapper = document.querySelector('#dark-lab');
const reveal = document.querySelector('#dark-lab-reveal');
const canvasRoot = document.querySelector('#dark-lab-canvas-root');
const copy = document.querySelector('.dark-lab-copy');

if(wrapper && reveal && canvasRoot){
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let interactive = false;
  let scene = null;
  let lastScrollY = window.scrollY;
  let scrollSpin = 0;

  /* ---------------------------------------------------------------- */
  /* scroll-linked wipe + text fade                                    */
  /* ---------------------------------------------------------------- */
  function updateWipe(){
    const rect = wrapper.getBoundingClientRect();
    const vh = window.innerHeight;
    const total = rect.height - vh;
    const scrolled = -rect.top;
    const progress = total > 0 ? Math.min(Math.max(scrolled / total, 0), 1) : 0;
    const wipe = Math.min(progress / 0.45, 1);

    const currentScrollY = window.scrollY;
    const delta = currentScrollY - lastScrollY;
    lastScrollY = currentScrollY;
    scrollSpin = Math.max(-45, Math.min(45, scrollSpin + delta * 0.06));

    reveal.style.setProperty('--wipe', (wipe * 150).toFixed(1));

    const nowInteractive = wipe >= 0.92;
    if(nowInteractive !== interactive){
      interactive = nowInteractive;
      reveal.classList.toggle('is-active', interactive);
      if(scene) scene.controls.enabled = interactive;
    }

    if(copy){
      const textT = Math.min(Math.max((progress - 0.55) / 0.3, 0), 1);
      copy.style.opacity = String(1 - textT);
      copy.style.transform = `translateY(${-textT * 60}px)`;
    }
  }

  if(reduceMotion){
    wrapper.classList.add('no-motion');
    interactive = true;
    reveal.classList.add('is-active');
  } else {
    window.addEventListener('scroll', updateWipe, { passive: true });
    updateWipe();
  }

  /* ---------------------------------------------------------------- */
  /* three.js block scene                                              */
  /* ---------------------------------------------------------------- */
  function buildScene(){
    const isSmall = canvasRoot.clientWidth < 700;

    const threeScene = new THREE.Scene();
    threeScene.background = new THREE.Color(0x0e0e12);
    threeScene.fog = new THREE.Fog(0x0e0e12, 20, 55);

    const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 1000);
    camera.position.set(0, 3, 22);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = !isSmall;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    canvasRoot.appendChild(renderer.domElement);

    const ambient = new THREE.AmbientLight(0xffffff, 0.55);
    threeScene.add(ambient);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.1);
    keyLight.position.set(10, 15, 10);
    keyLight.castShadow = !isSmall;
    keyLight.shadow.mapSize.set(isSmall ? 512 : 2048, isSmall ? 512 : 2048);
    keyLight.shadow.camera.left = -20;
    keyLight.shadow.camera.right = 20;
    keyLight.shadow.camera.top = 20;
    keyLight.shadow.camera.bottom = -20;
    keyLight.shadow.camera.near = 1;
    keyLight.shadow.camera.far = 50;
    keyLight.shadow.bias = -0.001;
    keyLight.shadow.normalBias = 0.02;
    threeScene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x88aaff, 0.35);
    fillLight.position.set(-10, -5, -10);
    threeScene.add(fillLight);

    const groundGeo = new THREE.PlaneGeometry(120, 120);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x141418, roughness: 1, metalness: 0 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -10;
    ground.receiveShadow = !isSmall;
    threeScene.add(ground);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 6;
    controls.maxDistance = 45;
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.target.set(0, 0, 0);
    controls.enabled = interactive;
    controls.autoRotate = !reduceMotion;
    controls.autoRotateSpeed = 0;

    const palette = [0x6c8cff, 0xff6c8c, 0x6cffb0, 0xffd76c, 0xb06cff, 0x6cf0ff, 0xff9a6c];
    const BLOCK_COUNT = isSmall ? 70 : 140;
    const blocks = [];
    const spread = 16;
    const sharedGeo = new THREE.BoxGeometry(1, 1, 1);

    for(let i = 0; i < BLOCK_COUNT; i++){
      const size = 0.5 + Math.random() * 0.9;
      const color = palette[Math.floor(Math.random() * palette.length)];
      const mat = new THREE.MeshStandardMaterial({
        color, roughness: 0.35, metalness: 0.15,
        emissive: 0x000000, emissiveIntensity: 0,
      });
      const mesh = new THREE.Mesh(sharedGeo, mat);
      mesh.scale.set(size, size, size);

      const basePos = new THREE.Vector3(
        (Math.random() - 0.5) * spread * 2,
        (Math.random() - 0.5) * spread * 1.3,
        (Math.random() - 0.5) * spread * 2
      );
      mesh.position.copy(basePos);
      mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      mesh.castShadow = !isSmall;
      mesh.receiveShadow = !isSmall;

      mesh.userData = {
        basePos: basePos.clone(),
        floatSpeed: 0.4 + Math.random() * 0.8,
        floatPhase: Math.random() * Math.PI * 2,
        floatAmp: 0.4 + Math.random() * 0.6,
        rotSpeed: new THREE.Vector3(
          (Math.random() - 0.5) * 0.5,
          (Math.random() - 0.5) * 0.5,
          (Math.random() - 0.5) * 0.5
        ),
        velocity: new THREE.Vector3(0, 0, 0),
        punched: false,
        dragging: false,
        baseColor: color,
        baseScale: size,
        hoverScale: 1,
      };

      threeScene.add(mesh);
      blocks.push(mesh);
    }

    const raycaster = new THREE.Raycaster();
    const pointerNDC = new THREE.Vector2();
    const dragPlane = new THREE.Plane();
    const dragOffset = new THREE.Vector3();
    const dragPoint = new THREE.Vector3();

    let hovered = null;
    let dragging = null;
    let pointerDownPos = { x: 0, y: 0 };
    let pointerIsDown = false;
    let didDrag = false;

    function updatePointer(event){
      const rect = renderer.domElement.getBoundingClientRect();
      pointerNDC.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointerNDC.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    }

    function getIntersect(){
      raycaster.setFromCamera(pointerNDC, camera);
      const hits = raycaster.intersectObjects(blocks, false);
      return hits.length > 0 ? hits[0] : null;
    }

    function punchBlock(mesh){
      const dir = new THREE.Vector3().subVectors(mesh.position, camera.position).normalize();
      dir.x += (Math.random() - 0.5) * 0.6;
      dir.y += (Math.random() - 0.5) * 0.6 + 0.3;
      dir.z += (Math.random() - 0.5) * 0.6;
      dir.normalize();
      mesh.userData.velocity.add(dir.multiplyScalar(6 + Math.random() * 3));
      mesh.userData.punched = true;

      mesh.material.emissive.setHex(mesh.userData.baseColor);
      mesh.material.emissiveIntensity = 0.8;
    }

    renderer.domElement.addEventListener('pointerdown', (event) => {
      if(!interactive) return;
      updatePointer(event);
      pointerDownPos = { x: event.clientX, y: event.clientY };
      pointerIsDown = true;
      didDrag = false;

      const hit = getIntersect();
      if(hit){
        dragging = hit.object;
        dragging.userData.dragging = true;
        controls.enabled = false;

        const normal = camera.getWorldDirection(new THREE.Vector3()).negate();
        dragPlane.setFromNormalAndCoplanarPoint(normal, hit.object.position);
        raycaster.ray.intersectPlane(dragPlane, dragPoint);
        dragOffset.copy(dragging.position).sub(dragPoint);
      }
    });

    window.addEventListener('pointermove', (event) => {
      if(!interactive) return;
      updatePointer(event);

      if(pointerIsDown){
        const dx = event.clientX - pointerDownPos.x;
        const dy = event.clientY - pointerDownPos.y;
        if(Math.sqrt(dx * dx + dy * dy) > 4) didDrag = true;
      }

      if(dragging){
        raycaster.setFromCamera(pointerNDC, camera);
        if(raycaster.ray.intersectPlane(dragPlane, dragPoint)){
          dragging.position.copy(dragPoint.add(dragOffset));
          dragging.userData.velocity.set(0, 0, 0);
        }
      } else {
        const hit = getIntersect();
        const newHover = hit ? hit.object : null;
        if(newHover !== hovered){
          if(hovered) hovered.userData.hoverScale = 1;
          hovered = newHover;
          if(hovered) hovered.userData.hoverScale = 1.15;
          renderer.domElement.style.cursor = hovered ? 'pointer' : 'default';
        }
      }
    });

    window.addEventListener('pointerup', (event) => {
      if(!interactive) return;
      updatePointer(event);

      if(dragging){
        dragging.userData.dragging = false;
        dragging.userData.basePos.copy(dragging.position);
        dragging = null;
        controls.enabled = true;
      } else if(pointerIsDown && !didDrag){
        const hit = getIntersect();
        if(hit) punchBlock(hit.object);
      }

      pointerIsDown = false;
    });

    renderer.domElement.addEventListener('pointerleave', () => {
      if(hovered){
        hovered.userData.hoverScale = 1;
        hovered = null;
      }
    });

    const clock = new THREE.Clock();

    function animate(){
      const dt = Math.min(clock.getDelta(), 0.05);
      const t = clock.getElapsedTime();

      for(let i = 0; i < blocks.length; i++){
        const mesh = blocks[i];
        const data = mesh.userData;

        if(data.dragging){
          // position handled by pointer drag
        } else if(data.punched){
          data.velocity.y -= 9.8 * dt;
          mesh.position.addScaledVector(data.velocity, dt);
          data.velocity.multiplyScalar(0.985);

          mesh.rotation.x += data.rotSpeed.x * dt * 2;
          mesh.rotation.y += data.rotSpeed.y * dt * 2;
          mesh.rotation.z += data.rotSpeed.z * dt * 2;

          const distFromBase = mesh.position.distanceTo(data.basePos);
          const pull = new THREE.Vector3().subVectors(data.basePos, mesh.position).multiplyScalar(0.6 * dt);
          data.velocity.add(pull);

          if(mesh.material.emissiveIntensity > 0.01){
            mesh.material.emissiveIntensity *= 0.92;
          } else {
            mesh.material.emissiveIntensity = 0;
          }

          if(distFromBase < 0.05 && data.velocity.length() < 0.3){
            data.punched = false;
            data.velocity.set(0, 0, 0);
            mesh.material.emissiveIntensity = 0;
          }
        } else if(reduceMotion){
          mesh.position.copy(data.basePos);
        } else {
          const floatY = Math.sin(t * data.floatSpeed + data.floatPhase) * data.floatAmp;
          mesh.position.x += (data.basePos.x - mesh.position.x) * 0.02;
          mesh.position.z += (data.basePos.z - mesh.position.z) * 0.02;
          mesh.position.y = data.basePos.y + floatY;

          mesh.rotation.x += data.rotSpeed.x * dt * 0.3;
          mesh.rotation.y += data.rotSpeed.y * dt * 0.3;
          mesh.rotation.z += data.rotSpeed.z * dt * 0.3;
        }

        const targetScale = data.baseScale * (data.hoverScale || 1);
        const currentScale = mesh.scale.x;
        const lerped = currentScale + (targetScale - currentScale) * 0.2;
        mesh.scale.set(lerped, lerped, lerped);
      }

      if(!reduceMotion){
        controls.autoRotateSpeed = scrollSpin;
        scrollSpin *= 0.9;
      }

      controls.update();
      renderer.render(threeScene, camera);
    }

    function resize(){
      const w = canvasRoot.clientWidth;
      const h = canvasRoot.clientHeight;
      if(w === 0 || h === 0) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }

    window.addEventListener('resize', resize);
    resize();

    return { renderer, animate, controls };
  }

  scene = buildScene();
  scene.controls.enabled = interactive;

  if(reduceMotion){
    scene.renderer.setAnimationLoop(scene.animate);
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        scene.renderer.setAnimationLoop(entry.isIntersecting ? scene.animate : null);
      });
    }, { threshold: 0.01 });
    io.observe(wrapper);
  }
}
