import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Button, Checkbox, Form, Input } from 'antd';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { useSearchParams } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import styles from './index.module.scss';

import * as THREE from 'three';

import { login } from '@/apis/auth';
import { useAuthStore } from '@/stores/authStore';

interface LoginFormValues {
  username: string;
  password: string;
}

/**
 * 登录页背景占位组件（后续替换为 three.js 渲染）。
 * 这里先把结构和业务逻辑接入，避免后续三维实现返工。
 */
function ThreeBackground({ cardRef }: { cardRef: React.RefObject<HTMLDivElement | null> }) {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;

    const themeColorRaw = getComputedStyle(document.documentElement).getPropertyValue('--theme-color').trim();
    const themeColor = themeColorRaw || '#7db87b';

    const width = mountRef.current.clientWidth || window.innerWidth;
    const height = mountRef.current.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(new THREE.Color(themeColor), 48, 190);

    const camera = new THREE.PerspectiveCamera(48, width / height, 0.1, 300);
    // 往后拉远相机，让实例看起来更“远更小”
    camera.position.set(0, 0, 95);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0);

    const canvas = renderer.domElement;
    canvas.style.position = 'absolute';
    canvas.style.inset = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.display = 'block';

    mountRef.current.appendChild(canvas);

    // 用小球（Sphere）替代 Points 的“方块点”，提升圆润感。
    const particleCount = Math.floor(Math.min(1200, Math.max(600, (width * height) / 1200)));

    const colorA = new THREE.Color(themeColor);
    const colorB = new THREE.Color('#a7f3d0'); // 浅绿霓虹
    const colorC = new THREE.Color('#93c5fd'); // 偏蓝的冷色点缀

    const sphereGeometry = new THREE.SphereGeometry(0.26, 10, 10);
    const normalMaterial = new THREE.MeshStandardMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      // 更光滑：降低 roughness，同时金属感稍微增强
      roughness: 0.28,
      metalness: 0.08,
      // Emissive 统一用白色，发光更“霓虹”
      emissive: 0xffffff,
      emissiveIntensity: 0.25,
    });

    const glowMaterial = new THREE.MeshStandardMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 1,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      // 发光球：更亮、更顺滑的高反光质感
      roughness: 0.15,
      metalness: 0.18,
      emissive: 0xffffff,
      emissiveIntensity: 1.75,
    });

    // 固定随机：只让其中 50 个小球“发光”
    const glowCount = Math.min(50, particleCount);
    const glowSet = new Set<number>();
    while (glowSet.size < glowCount) {
      glowSet.add(Math.floor(Math.random() * particleCount));
    }

    const positions = new Float32Array(particleCount * 3);
    const scales = new Float32Array(particleCount);
    const colors = new Float32Array(particleCount * 3);
    const shapeOffsets = new Float32Array(particleCount * 3);
    const currentPositions = new Float32Array(particleCount * 3);
    // 每个粒子的“追赶速度”（越小拖尾越明显）
    const followSpeeds = new Float32Array(particleCount);

    // 默认使用“盒子格子”目标点；凝聚时会随机切换形状并重写 shapeOffsets
    const cubeSide = Math.ceil(Math.pow(particleCount, 1 / 3));
    const cubeSize = 14; // 形状整体在世界坐标中的尺度
    const cubeSpacing = cubeSize / cubeSide;
    const cubeHalf = (cubeSide - 1) / 2;

    type ShapeType = 'box' | 'sphere' | 'cylinder' | 'torus';
    const shapes: ShapeType[] = ['box', 'sphere', 'cylinder', 'torus'];

    function mulberry32(seed: number) {
      return function rand() {
        let t = (seed += 0x6d2b79f5);
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    }

    function fillShapeOffsets(shape: ShapeType, seed: number) {
      const rng = mulberry32(seed);
      const R = cubeSize * 0.5;
      const height = cubeSize;

      if (shape === 'box') {
        for (let i = 0; i < particleCount; i += 1) {
          const ix = i % cubeSide;
          const iy = Math.floor(i / cubeSide) % cubeSide;
          const iz = Math.floor(i / (cubeSide * cubeSide));
          shapeOffsets[i * 3 + 0] = (ix - cubeHalf) * cubeSpacing;
          shapeOffsets[i * 3 + 1] = (iy - cubeHalf) * cubeSpacing;
          shapeOffsets[i * 3 + 2] = (iz - cubeHalf) * cubeSpacing;
        }
        return;
      }

      if (shape === 'sphere') {
        // golden spiral 在球面上“均匀铺点”
        const goldenAngle = Math.PI * (3 - Math.sqrt(5));
        const rot = rng() * Math.PI * 2;
        for (let i = 0; i < particleCount; i += 1) {
          const y = 1 - (2 * (i + 0.5)) / particleCount;
          const r = Math.sqrt(Math.max(0, 1 - y * y));
          const theta = goldenAngle * i + rot;
          const x = Math.cos(theta) * r * R;
          const z = Math.sin(theta) * r * R;
          shapeOffsets[i * 3 + 0] = x;
          shapeOffsets[i * 3 + 1] = y * R;
          shapeOffsets[i * 3 + 2] = z;
        }
        return;
      }

      if (shape === 'cylinder') {
        const angleOffset = rng() * Math.PI * 2;
        const twist = 0.6 + rng() * 1.2;
        for (let i = 0; i < particleCount; i += 1) {
          const t = i / particleCount;
          const theta = angleOffset + t * Math.PI * 2 * twist;
          const y = (t - 0.5) * height;
          shapeOffsets[i * 3 + 0] = Math.cos(theta) * R;
          shapeOffsets[i * 3 + 1] = y;
          shapeOffsets[i * 3 + 2] = Math.sin(theta) * R;
        }
        return;
      }

      // torus
      const majorR = R * (0.85 + rng() * 0.15);
      const minorR = R * (0.22 + rng() * 0.12);
      const uOffset = rng() * Math.PI * 2;
      const vOffset = rng() * Math.PI * 2;
      for (let i = 0; i < particleCount; i += 1) {
        const u = uOffset + (i / particleCount) * Math.PI * 2 * (1.0 + rng() * 0.3);
        const v = vOffset + (((i * 7) % particleCount) / particleCount) * Math.PI * 2;
        const x = (majorR + minorR * Math.cos(v)) * Math.cos(u);
        const y = minorR * Math.sin(v);
        const z = (majorR + minorR * Math.cos(v)) * Math.sin(u);
        shapeOffsets[i * 3 + 0] = x;
        shapeOffsets[i * 3 + 1] = y;
        shapeOffsets[i * 3 + 2] = z;
      }
    }

    const dummy = new THREE.Object3D();

    for (let i = 0; i < particleCount; i += 1) {
      // 以球体分布生成随机实例，形成“空间感”
      const u = Math.random();
      const v = Math.random();
      const theta = 2 * Math.PI * u;
      const phi = Math.acos(2 * v - 1);

      const r = 18 + Math.random() * 55;
      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.cos(phi);
      const z = r * Math.sin(phi) * Math.sin(theta);

      positions[i * 3 + 0] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      // 正方体局部偏移（以原点为中心）
      const ix = i % cubeSide;
      const iy = Math.floor(i / cubeSide) % cubeSide;
      const iz = Math.floor(i / (cubeSide * cubeSide));

      shapeOffsets[i * 3 + 0] = (ix - cubeHalf) * cubeSpacing;
      shapeOffsets[i * 3 + 1] = (iy - cubeHalf) * cubeSpacing;
      shapeOffsets[i * 3 + 2] = (iz - cubeHalf) * cubeSpacing;

      // 少量混色，让视觉更“炫”
      const pick = Math.random();
      const cc = pick < 0.7 ? colorA : pick < 0.9 ? colorB : colorC;
      colors[i * 3 + 0] = cc.r;
      colors[i * 3 + 1] = cc.g;
      colors[i * 3 + 2] = cc.b;

      // 缩小实例尺寸，让“球更小、密度更高级”
      const s = 0.55 + Math.random() * 0.5;
      scales[i] = s;

      // 速度分布：少数更慢，拖尾更明显
      followSpeeds[i] = 0.015 + Math.random() * 0.055;
    }

    const normalCount = particleCount - glowCount;
    const spheresNormal = new THREE.InstancedMesh(sphereGeometry, normalMaterial, normalCount);
    const spheresGlow = new THREE.InstancedMesh(sphereGeometry, glowMaterial, glowCount);

    let normalIndex = 0;
    let glowIndex = 0;

    const normalParticleIndices = new Int32Array(normalCount);
    const glowParticleIndices = new Int32Array(glowCount);

    const c = new THREE.Color();
    for (let i = 0; i < particleCount; i += 1) {
      const x = positions[i * 3 + 0];
      const y = positions[i * 3 + 1];
      const z = positions[i * 3 + 2];
      const s = scales[i];

      dummy.position.set(x, y, z);
      dummy.scale.setScalar(s);
      dummy.updateMatrix();

      c.setRGB(colors[i * 3 + 0], colors[i * 3 + 1], colors[i * 3 + 2]);

      if (glowSet.has(i)) {
        spheresGlow.setMatrixAt(glowIndex, dummy.matrix);
        spheresGlow.setColorAt(glowIndex, c);
        glowParticleIndices[glowIndex] = i;
        glowIndex += 1;
      } else {
        spheresNormal.setMatrixAt(normalIndex, dummy.matrix);
        spheresNormal.setColorAt(normalIndex, c);
        normalParticleIndices[normalIndex] = i;
        normalIndex += 1;
      }
    }

    spheresNormal.instanceMatrix.needsUpdate = true;
    if (spheresNormal.instanceColor) spheresNormal.instanceColor.needsUpdate = true;
    spheresGlow.instanceMatrix.needsUpdate = true;
    if (spheresGlow.instanceColor) spheresGlow.instanceColor.needsUpdate = true;

    scene.add(spheresNormal);
    scene.add(spheresGlow);

    // 光源（用于 MeshStandardMaterial 的体积/高光效果）
    const ambient = new THREE.AmbientLight(0xffffff, 0.55);
    scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(colorA, 0.9);
    dirLight.position.set(55, 60, 80);
    scene.add(dirLight);

    // 依据鼠标位置聚拢：把鼠标投影到世界 z=0 平面，作为正方体聚拢中心
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const planeZ = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);

    const cubeCenter = new THREE.Vector3(0, 0, 0);
    const targetCubeCenter = new THREE.Vector3(0, 0, 0);
    let gatherProgress = 0; // 0：分散原始分布；1：聚拢组成正方体
    let targetGatherProgress = 0;

    let mouseX = 0;
    let mouseY = 0;
    let targetMouseX = 0;
    let targetMouseY = 0;

    const onMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = (e.clientY / window.innerHeight) * 2 - 1;
      targetMouseX = x;
      targetMouseY = y;

      // 是否在 card 区域内：不在时聚拢，在时分散
      const cardEl = cardRef.current;
      if (cardEl) {
        const rect = cardEl.getBoundingClientRect();
        const isInside =
          e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom;
        targetGatherProgress = isInside ? 0 : 1;
      } else {
        targetGatherProgress = 1;
      }

      // 计算鼠标到世界坐标的交点，用于正方体目标中心
      const ndcX = x;
      const ndcY = -(e.clientY / window.innerHeight) * 2 + 1;
      pointer.set(ndcX, ndcY);
      raycaster.setFromCamera(pointer, camera);
      raycaster.ray.intersectPlane(planeZ, targetCubeCenter);
    };

    const onResize = () => {
      if (!mountRef.current) return;
      const nextWidth = mountRef.current.clientWidth || window.innerWidth;
      const nextHeight = mountRef.current.clientHeight || window.innerHeight;
      camera.aspect = nextWidth / nextHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(nextWidth, nextHeight);
    };

    const mountNode = mountRef.current;

    // 当鼠标离开当前屏幕/页面区域（离开覆盖层）时，也按“分散”处理
    // mouseenter/mouseleave 对 element 生效；这里 element 覆盖整个登录页背景区域，离开浏览器窗口通常会触发 mouseleave。
    const onMouseLeave = () => {
      targetGatherProgress = 0;
      targetMouseX = 0;
      targetMouseY = 0;
    };

    // 当用户离开网页/切到别的标签页/窗口失焦时，也触发分散
    const onBlur = () => {
      targetGatherProgress = 0;
      targetMouseX = 0;
      targetMouseY = 0;
    };

    const onVisibilityChange = () => {
      if (document.hidden) onBlur();
    };

    if (!reducedMotion) {
      window.addEventListener('mousemove', onMouseMove, { passive: true });
    }
    window.addEventListener('resize', onResize, { passive: true });
    mountNode?.addEventListener('mouseleave', onMouseLeave);
    window.addEventListener('blur', onBlur);
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('pagehide', onBlur);

    let rafId = 0;
    const start = performance.now();
    let forceUpdateUntil = 0;
    let lastWasGathering = false;
    let disperseStartAt = 0;
    let disperseFromProgress = 1;
    let rotationStarted = false;
    let rotAnchorY = 0;
    let rotAnchorX = 0;

    const animate = (now: number) => {
      const elapsed = now - start;

      if (!reducedMotion) {
        // 鼠标目标值平滑过渡到当前值
        mouseX += (targetMouseX - mouseX) * 0.06;
        mouseY += (targetMouseY - mouseY) * 0.06;

        // 聚拢进度：card 之外聚拢，card 内分散
        const isDispersingTarget = targetGatherProgress <= 0.001;

        if (isDispersingTarget) {
          // 从凝聚切到分散：固定 2s 完成 1 -> 0
          if (disperseStartAt === 0) {
            disperseStartAt = now;
            disperseFromProgress = gatherProgress;
            forceUpdateUntil = now + 2500;
          }

          const t = Math.min(1, Math.max(0, (now - disperseStartAt) / 2000));
          const ease = t * t * (3 - 2 * t); // smoothstep
          gatherProgress = disperseFromProgress * (1 - ease);
        } else {
          // 从分散切回凝聚：快速聚拢到正方体
          disperseStartAt = 0;
          gatherProgress += (targetGatherProgress - gatherProgress) * 0.08;
        }

        gatherProgress = Math.max(0, Math.min(1, gatherProgress));
        cubeCenter.lerp(targetCubeCenter, 0.12);

        const isGatheringNow = targetGatherProgress > 0.001;
        // 凝聚开始时随机选择形状，并重写目标 offsets
        if (!lastWasGathering && isGatheringNow) {
          const nextShape = shapes[Math.floor(Math.random() * shapes.length)];
          const nextSeed = Math.floor(Math.random() * 1e9);
          fillShapeOffsets(nextShape, nextSeed);
        }
        // 从“凝聚”切回“分散”时，额外强制更新一段时间，确保回到初始化分散布局
        if (lastWasGathering && !isGatheringNow) {
          forceUpdateUntil = now + 2500;
          disperseStartAt = now;
          disperseFromProgress = gatherProgress;
        }
        lastWasGathering = isGatheringNow;

        // 更新实例矩阵：当聚拢进度不为 0 时，让粒子逐步形成正方体并汇聚到鼠标附近
        const shouldUpdateInstances =
          now < forceUpdateUntil || gatherProgress > 0.0001 || targetGatherProgress > 0.0001;
        if (shouldUpdateInstances) {
          const g = gatherProgress;
          const isGathering = targetGatherProgress > 0.001;
          // 拖尾：当形成正方体/鼠标在外侧时，允许慢一些的球“延迟追赶”
          // 分散阶段（回到 card 内）则加快回弹，避免边缘出现空洞感
          const tailMultiplier = isGathering ? 1 : 1;
          let alphaBase = 0.5;
          if (!isGathering) {
            const tDisp = disperseStartAt > 0 ? Math.min(1, Math.max(0, (now - disperseStartAt) / 2000)) : 1;
            // 分散刚开始更慢，随着 2s 完成逐渐加速（产生“慢慢散开”的观感）
            alphaBase = 0.22 + 0.33 * tDisp;
          }

          for (let local = 0; local < normalCount; local += 1) {
            const pIndex = normalParticleIndices[local];
            const ox = positions[pIndex * 3 + 0];
            const oy = positions[pIndex * 3 + 1];
            const oz = positions[pIndex * 3 + 2];

            const tx = cubeCenter.x + shapeOffsets[pIndex * 3 + 0];
            const ty = cubeCenter.y + shapeOffsets[pIndex * 3 + 1];
            const tz = cubeCenter.z + shapeOffsets[pIndex * 3 + 2];

            const desiredX = ox + (tx - ox) * g;
            const desiredY = oy + (ty - oy) * g;
            const desiredZ = oz + (tz - oz) * g;

            const cxIndex = pIndex * 3;
            const cx = currentPositions[cxIndex + 0];
            const cy = currentPositions[cxIndex + 1];
            const cz = currentPositions[cxIndex + 2];

            const alpha = followSpeeds[pIndex] * (alphaBase + (1 - alphaBase) * g) * tailMultiplier;
            const nextX = cx + (desiredX - cx) * alpha;
            const nextY = cy + (desiredY - cy) * alpha;
            const nextZ = cz + (desiredZ - cz) * alpha;

            currentPositions[cxIndex + 0] = nextX;
            currentPositions[cxIndex + 1] = nextY;
            currentPositions[cxIndex + 2] = nextZ;

            dummy.position.set(nextX, nextY, nextZ);
            dummy.scale.setScalar(scales[pIndex]);
            dummy.updateMatrix();
            spheresNormal.setMatrixAt(local, dummy.matrix);
          }

          for (let local = 0; local < glowCount; local += 1) {
            const pIndex = glowParticleIndices[local];
            const ox = positions[pIndex * 3 + 0];
            const oy = positions[pIndex * 3 + 1];
            const oz = positions[pIndex * 3 + 2];

            const tx = cubeCenter.x + shapeOffsets[pIndex * 3 + 0];
            const ty = cubeCenter.y + shapeOffsets[pIndex * 3 + 1];
            const tz = cubeCenter.z + shapeOffsets[pIndex * 3 + 2];

            const desiredX = ox + (tx - ox) * g;
            const desiredY = oy + (ty - oy) * g;
            const desiredZ = oz + (tz - oz) * g;

            const cxIndex = pIndex * 3;
            const cx = currentPositions[cxIndex + 0];
            const cy = currentPositions[cxIndex + 1];
            const cz = currentPositions[cxIndex + 2];

            const alpha = followSpeeds[pIndex] * (0.35 + 0.65 * g) * tailMultiplier;
            const nextX = cx + (desiredX - cx) * alpha;
            const nextY = cy + (desiredY - cy) * alpha;
            const nextZ = cz + (desiredZ - cz) * alpha;

            currentPositions[cxIndex + 0] = nextX;
            currentPositions[cxIndex + 1] = nextY;
            currentPositions[cxIndex + 2] = nextZ;

            dummy.position.set(nextX, nextY, nextZ);
            dummy.scale.setScalar(scales[pIndex]);
            dummy.updateMatrix();
            spheresGlow.setMatrixAt(local, dummy.matrix);
          }

          spheresNormal.instanceMatrix.needsUpdate = true;
          spheresGlow.instanceMatrix.needsUpdate = true;
        }

        // 相机小范围视差
        camera.position.x = mouseX * 7;
        camera.position.y = -mouseY * 5;
        camera.lookAt(0, 0, 0);

        // 旋转逻辑：
        // - 凝聚阶段不旋转
        // - 分散开始后，满 2 秒后再开启旋转，并保持恒定角速度
        // - 为避免“分散瞬间加速/匀速不一致”，不再使用 rotEnable 渐变乘法
        const isDispersing = targetGatherProgress <= 0.001;
        const sinceDisperse = isDispersing && disperseStartAt > 0 ? Math.max(0, now - disperseStartAt) : 0;

        const enableRotation = isDispersing && sinceDisperse >= 2000;
        if (!enableRotation) {
          rotationStarted = false;
          spheresNormal.rotation.y = 0;
          spheresNormal.rotation.x = 0;
          spheresGlow.rotation.y = 0;
          spheresGlow.rotation.x = 0;
        } else {
          // 开启旋转时捕获锚点，避免角度跳变（开始瞬间角度仍为 0）
          if (!rotationStarted) {
            rotationStarted = true;
            rotAnchorY = elapsed * 0.00045;
            rotAnchorX = elapsed * 0.00018;
          }

          // 恒定角速度（不依赖鼠标实时值，避免由于鼠标变化引入“加速”观感）
          const rotY = elapsed * 0.00045;
          const rotX = elapsed * 0.00018;

          spheresNormal.rotation.y = rotY - rotAnchorY;
          spheresNormal.rotation.x = rotX - rotAnchorX;
          spheresGlow.rotation.y = rotY - rotAnchorY;
          spheresGlow.rotation.x = rotX - rotAnchorX;
        }

        // 发光“闪烁”效果（固定 50 个实例一起变亮/变暗）
        const flash = Math.abs(Math.sin(elapsed * 0.0115));
        const flashSharp = flash ** 3; // 让闪烁更“尖锐”一些
        glowMaterial.emissiveIntensity = 1.35 + flashSharp * 2.6;
      } else {
        // 降级：保持静态但仍做很轻的旋转，确保不会完全空白
        spheresNormal.rotation.y = 0;
        spheresGlow.rotation.y = 0;
        glowMaterial.emissiveIntensity = 1.55;
      }

      renderer.render(scene, camera);
      rafId = window.requestAnimationFrame(animate);
    };

    // 首帧先渲染，避免空白
    renderer.render(scene, camera);
    rafId = window.requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', onResize);
      if (!reducedMotion) window.removeEventListener('mousemove', onMouseMove);
      mountNode?.removeEventListener('mouseleave', onMouseLeave);
      window.removeEventListener('blur', onBlur);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('pagehide', onBlur);
      window.cancelAnimationFrame(rafId);

      scene.remove(spheresNormal);
      scene.remove(spheresGlow);
      sphereGeometry.dispose();
      normalMaterial.dispose();
      glowMaterial.dispose();
      renderer.dispose();

      if (canvas.parentElement) canvas.parentElement.removeChild(canvas);
    };
  }, [cardRef]);

  return <div ref={mountRef} className={styles.threeBg} aria-hidden="true" />;
}

const LoginTwo: React.FC = () => {
  const [form] = Form.useForm<LoginFormValues>();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const authLogin = useAuthStore((s) => s.login);

  const [rememberMe, setRememberMe] = useState(true);
  const cardRef = useRef<HTMLDivElement | null>(null);

  const { mutate, isPending, isError, error } = useMutation({
    mutationFn: login,
    onSuccess: ({ token, user }) => {
      authLogin(token, [...user.roles], [...user.permissions]);
      queryClient.setQueryData(['user', 'me'], user);

      const from = searchParams.get('from') ?? '/';
      window.location.href = from;
    },
  });

  const errorMessage = useMemo(() => {
    if (!isError) return '';
    if (error instanceof Error) return error.message;
    return '登录失败，请稍后重试';
  }, [error, isError]);

  const onFinish = (values: LoginFormValues) => {
    mutate(values);
  };

  return (
    <div className={styles.login}>
      <ThreeBackground cardRef={cardRef} />

      <div ref={cardRef} className={styles.card}>
        <div className={styles.header}>
          <div className={styles.iconWrap} aria-hidden="true">
            <LockOutlined className={styles.headerIcon} />
          </div>
          <h1 className={styles.title}>登录</h1>
          <p className={styles.subtitle}>欢迎回来，请登录您的账户（演示：admin / 123456）</p>
        </div>

        {isError && (
          <div className={styles.alertWrap}>
            <Alert type="error" showIcon message="登录失败" description={errorMessage} />
          </div>
        )}

        <Form form={form} layout="vertical" size="large" onFinish={onFinish} className={styles.form}>
          <Form.Item name="username" label="用户名" rules={[{ required: true, message: '请输入用户名' }]}>
            <Input
              prefix={<UserOutlined className={styles.inputIcon} />}
              placeholder="请输入用户名"
              autoComplete="username"
            />
          </Form.Item>

          <Form.Item name="password" label="密码" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password
              prefix={<LockOutlined className={styles.inputIcon} />}
              placeholder="请输入密码"
              autoComplete="current-password"
            />
          </Form.Item>

          <Form.Item className={styles.submitItem}>
            <Button type="primary" htmlType="submit" block size="large" loading={isPending}>
              登录
            </Button>
          </Form.Item>

          <div className={styles.rememberRow}>
            <Checkbox checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)}>
              记住我
            </Checkbox>
          </div>
        </Form>

        <div className={styles.bottomLinks}>
          <a
            className={styles.link}
            href="#"
            onClick={(e) => {
              e.preventDefault();
            }}
          >
            忘记密码？
          </a>
        </div>
      </div>
    </div>
  );
};

export default LoginTwo;
