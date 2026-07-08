"use client"

import { OrbitControls, OrthographicCamera } from "@react-three/drei"
import { Canvas, type ThreeEvent, useFrame, useThree } from "@react-three/fiber"
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import * as THREE from "three"
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js"

import {
  type ContributionDay,
  getContributionColor,
  getContributionLevel,
  GRAPH_CONFIG,
} from "@/lib/contribution-data"

export type IsometricContributionSceneProps = {
  data: ContributionDay[]
  onCaptureReady?: (capture: () => Promise<Blob | null>) => void
}

function SceneCapture({
  onCaptureReady,
}: {
  onCaptureReady?: (capture: () => Promise<Blob | null>) => void
}) {
  const { gl, scene, camera } = useThree()

  useEffect(() => {
    if (!onCaptureReady) return

    const capture = () =>
      new Promise<Blob | null>((resolve) => {
        gl.render(scene, camera)
        gl.domElement.toBlob((blob) => resolve(blob), "image/png", 1)
      })

    onCaptureReady(capture)
  }, [camera, gl, onCaptureReady, scene])

  return null
}

const MIN_BAR_HEIGHT = 0.04
const SHADOW_CAMERA_SIZE = 38
const GROW_DURATION_SECONDS = 1.05
const GROW_STAGGER_SECONDS = 0.42
const BLOCK_BEVEL_RADIUS = 0.08

type ContributionInstance = {
  dataIndex: number
  delay: number
  height: number
  x: number
  z: number
}

type TooltipState = {
  count: number
  date: string
  x: number
  y: number
}

function formatContributionDate(date: string) {
  const [year, month, day] = date.split("-").map(Number)
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  })
}

function formatContributionCount(count: number) {
  return `${count.toLocaleString()} contribution${count === 1 ? "" : "s"}`
}

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value))
}

function easeOutCubic(value: number) {
  return 1 - Math.pow(1 - clamp01(value), 3)
}

function ContributionBarLayer({
  cellSize,
  data,
  instances,
  color,
  level,
  onHover,
}: {
  cellSize: number
  data: ContributionDay[]
  instances: ContributionInstance[]
  color: string
  level: number
  onHover: (tooltip: TooltipState | null) => void
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const animationStartRef = useRef<number | null>(null)
  const animationDoneRef = useRef(false)
  const geometry = useMemo(
    () =>
      new RoundedBoxGeometry(
        cellSize,
        cellSize,
        cellSize,
        2,
        BLOCK_BEVEL_RADIUS
      ),
    [cellSize]
  )
  const material = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color,
        clearcoat: 0.18 + level * 0.035,
        clearcoatRoughness: 0.55,
        emissive: level === 0 ? "#000000" : color,
        emissiveIntensity: level === 0 ? 0 : 0.045,
        metalness: 0,
        reflectivity: 0.22,
        roughness: 0.38,
      }),
    [color, level]
  )

  const temp = useMemo(() => new THREE.Object3D(), [])

  const setInstanceMatrix = useCallback(
    (index: number, progress: number) => {
      const instance = instances[index]
      if (!instance) return

      const height = Math.max(instance.height * progress, MIN_BAR_HEIGHT * 0.05)
      temp.position.set(instance.x, height / 2, instance.z)
      temp.scale.set(1, height / cellSize, 1)
      temp.updateMatrix()
      meshRef.current?.setMatrixAt(index, temp.matrix)
    },
    [instances, temp, cellSize]
  )

  useLayoutEffect(() => {
    const mesh = meshRef.current
    if (!mesh || instances.length === 0) return

    instances.forEach((_, index) => {
      setInstanceMatrix(index, 0)
    })

    mesh.instanceMatrix.needsUpdate = true
    animationStartRef.current = null
    animationDoneRef.current = false
  }, [instances, setInstanceMatrix])

  useFrame(({ clock }) => {
    const mesh = meshRef.current
    if (!mesh || instances.length === 0 || animationDoneRef.current) return

    if (animationStartRef.current === null) {
      animationStartRef.current = clock.elapsedTime
    }

    const elapsed = clock.elapsedTime - animationStartRef.current
    let allComplete = true

    instances.forEach((instance, index) => {
      const progress = easeOutCubic(
        (elapsed - instance.delay) / GROW_DURATION_SECONDS
      )
      if (progress < 1) allComplete = false
      setInstanceMatrix(index, progress)
    })

    mesh.instanceMatrix.needsUpdate = true
    animationDoneRef.current = allComplete
  })

  const showTooltip = useCallback(
    (event: ThreeEvent<PointerEvent>) => {
      event.stopPropagation()
      const instance = instances[event.instanceId ?? -1]
      const day = data[instance?.dataIndex ?? -1]
      if (!instance || !day) return

      onHover({
        count: day.count,
        date: day.date,
        x: event.clientX,
        y: event.clientY,
      })
    },
    [data, instances, onHover]
  )

  const hideTooltip = useCallback(
    (event: ThreeEvent<PointerEvent>) => {
      event.stopPropagation()
      onHover(null)
    },
    [onHover]
  )

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, instances.length]}
      castShadow
      receiveShadow
      frustumCulled={false}
      onPointerOver={showTooltip}
      onPointerMove={showTooltip}
      onPointerOut={hideTooltip}
    />
  )
}

function ContributionTooltip({ tooltip }: { tooltip: TooltipState }) {
  return (
    <div
      className="pointer-events-none fixed z-50 -translate-y-full whitespace-nowrap rounded-md border border-emerald-300/20 bg-[#0d1117]/95 px-2.5 py-1.5 text-center shadow-lg shadow-black/40 backdrop-blur-sm"
      style={{ left: tooltip.x, top: tooltip.y - 10 }}
    >
      <p className="text-xs font-medium text-emerald-50">
        {formatContributionCount(tooltip.count)}
      </p>
      <p className="mt-0.5 text-[10px] text-emerald-100/60">
        {formatContributionDate(tooltip.date)}
      </p>
    </div>
  )
}

function ContributionBars({
  data,
  onTooltipChange,
}: {
  data: ContributionDay[]
  onTooltipChange: (tooltip: TooltipState | null) => void
}) {
  const { cellSize, gap, heightUnit } = GRAPH_CONFIG

  const handleHover = useCallback(
    (next: TooltipState | null) => {
      onTooltipChange(next)
    },
    [onTooltipChange]
  )

  const maxCount = useMemo(
    () => Math.max(...data.map((entry) => entry.count), 0),
    [data]
  )

  const weeks = useMemo(() => {
    if (data.length === 0) return GRAPH_CONFIG.weeks
    return Math.max(...data.map((entry) => entry.week)) + 1
  }, [data])

  const days = useMemo(() => {
    if (data.length === 0) return GRAPH_CONFIG.days
    return Math.max(...data.map((entry) => entry.day)) + 1
  }, [data])

  const maxHeight = useMemo(
    () =>
      Math.max(
        ...data.map((entry) =>
          entry.count > 0 ? entry.count * heightUnit : MIN_BAR_HEIGHT
        ),
        MIN_BAR_HEIGHT
      ),
    [data, heightUnit]
  )

  const gridWidth = weeks * (cellSize + gap)
  const gridDepth = days * (cellSize + gap)
  const offsetX = -gridWidth / 2 + cellSize / 2
  const offsetZ = -gridDepth / 2 + cellSize / 2
  const instances = useMemo(
    () =>
      data.map((entry, dataIndex) => {
        const height =
          entry.count > 0 ? entry.count * heightUnit : MIN_BAR_HEIGHT
        const weekRatio = weeks > 1 ? entry.week / (weeks - 1) : 0
        const dayRatio = days > 1 ? entry.day / (days - 1) : 0

        return {
          color: getContributionColor(entry.count, maxCount),
          dataIndex,
          delay: (weekRatio * 0.8 + dayRatio * 0.2) * GROW_STAGGER_SECONDS,
          height,
          level: getContributionLevel(entry.count, maxCount),
          x: offsetX + entry.week * (cellSize + gap),
          z: offsetZ + entry.day * (cellSize + gap),
        }
      }),
    [data, maxCount, offsetX, offsetZ, cellSize, gap, heightUnit, weeks, days]
  )
  const layers = useMemo(() => {
    const grouped = new Map<
      string,
      { color: string; instances: ContributionInstance[]; level: number }
    >()

    instances.forEach(({ color, level, ...instance }) => {
      const group = grouped.get(color) ?? { color, instances: [], level }
      group.instances.push(instance)
      grouped.set(color, group)
    })

    return [...grouped.values()]
  }, [instances])

  return (
    <group>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.01, 0]}
        receiveShadow
      >
        <planeGeometry args={[gridWidth + 2, gridDepth + 2]} />
        <meshStandardMaterial color="#00180c" roughness={0.85} />
      </mesh>

      {layers.map((layer) => (
        <ContributionBarLayer
          key={layer.color}
          cellSize={cellSize}
          color={layer.color}
          data={data}
          instances={layer.instances}
          level={layer.level}
          onHover={handleHover}
        />
      ))}

      <SceneCamera
        gridWidth={gridWidth}
        gridDepth={gridDepth}
        maxHeight={maxHeight}
      />
    </group>
  )
}

function SceneCamera({
  gridWidth,
  gridDepth,
  maxHeight,
}: {
  gridWidth: number
  gridDepth: number
  maxHeight: number
}) {
  const span = Math.max(gridWidth, gridDepth, 8)
  const zoom = Math.min(65, Math.max(22, 480 / span))
  const distance = span * 0.9
  const targetY = maxHeight / 2

  return (
    <>
      <OrthographicCamera
        makeDefault
        position={[distance, distance * 1.15, distance]}
        zoom={zoom}
        near={0.1}
        far={500}
        onUpdate={(camera) => camera.lookAt(0, targetY, 0)}
      />
      <OrbitControls
        enablePan
        enableZoom
        minZoom={zoom * 0.35}
        maxZoom={zoom * 2.5}
        maxPolarAngle={Math.PI / 2.1}
        target={[0, targetY, 0]}
      />
    </>
  )
}

export function IsometricContributionScene({
  data,
  onCaptureReady,
}: IsometricContributionSceneProps) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null)
  const tooltipRef = useRef<TooltipState | null>(null)
  const clearHoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  )

  const clearTooltip = useCallback((immediate = false) => {
    if (clearHoverTimeoutRef.current) {
      clearTimeout(clearHoverTimeoutRef.current)
      clearHoverTimeoutRef.current = null
    }

    if (immediate) {
      tooltipRef.current = null
      setTooltip(null)
      return
    }

    clearHoverTimeoutRef.current = setTimeout(() => {
      tooltipRef.current = null
      setTooltip(null)
      clearHoverTimeoutRef.current = null
    }, 16)
  }, [])

  const handleTooltipChange = useCallback(
    (next: TooltipState | null) => {
      if (clearHoverTimeoutRef.current) {
        clearTimeout(clearHoverTimeoutRef.current)
        clearHoverTimeoutRef.current = null
      }

      if (next === null) {
        clearTooltip()
        return
      }

      const current = tooltipRef.current
      if (
        current?.date === next.date &&
        current.count === next.count &&
        Math.abs(current.x - next.x) < 2 &&
        Math.abs(current.y - next.y) < 2
      ) {
        return
      }

      tooltipRef.current = next
      setTooltip(next)
    },
    [clearTooltip]
  )

  const handlePointerMissed = useCallback(() => {
    clearTooltip(true)
  }, [clearTooltip])

  const handlePointerLeave = useCallback(() => {
    clearTooltip(true)
  }, [clearTooltip])

  useEffect(() => {
    return () => {
      if (clearHoverTimeoutRef.current) {
        clearTimeout(clearHoverTimeoutRef.current)
      }
    }
  }, [])

  return (
    <div className="relative size-full" onPointerLeave={handlePointerLeave}>
      <Canvas
        shadows="soft"
        className="size-full cursor-pointer"
        gl={{ antialias: true, preserveDrawingBuffer: true }}
        dpr={[1, 2]}
        onPointerMissed={handlePointerMissed}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping
          gl.toneMappingExposure = 1.08
        }}
      >
        <color attach="background" args={["#010409"]} />
        <ambientLight intensity={0.58} />
        <hemisphereLight args={["#e8fff0", "#020b06", 0.7]} />
        <directionalLight
          position={[22, 34, 24]}
          intensity={3.35}
          castShadow
          shadow-bias={-0.00035}
          shadow-radius={4}
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-left={-SHADOW_CAMERA_SIZE}
          shadow-camera-right={SHADOW_CAMERA_SIZE}
          shadow-camera-top={SHADOW_CAMERA_SIZE}
          shadow-camera-bottom={-SHADOW_CAMERA_SIZE}
          shadow-camera-near={1}
          shadow-camera-far={90}
        />
        <directionalLight position={[-24, 18, -18]} intensity={0.8} />
        <directionalLight position={[0, 22, -28]} intensity={0.95} />

        <SceneCapture onCaptureReady={onCaptureReady} />
        <ContributionBars data={data} onTooltipChange={handleTooltipChange} />
      </Canvas>

      {tooltip ? <ContributionTooltip tooltip={tooltip} /> : null}
    </div>
  )
}