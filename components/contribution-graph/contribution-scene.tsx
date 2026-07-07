"use client"

import { OrbitControls, OrthographicCamera } from "@react-three/drei"
import { Canvas } from "@react-three/fiber"
import { useLayoutEffect, useMemo, useRef } from "react"
import * as THREE from "three"

import {
  type ContributionDay,
  getContributionColor3D,
  GRAPH_CONFIG,
} from "@/lib/contribution-data"

type ContributionSceneProps = {
  data: ContributionDay[]
}

const MIN_BAR_HEIGHT = 0.04
const SCENE_BACKGROUND = "#0d1117"
const FLOOR_COLOR = "#2d3640"

function ContributionBars({ data }: { data: ContributionDay[] }) {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const { cellSize, gap, heightUnit } = GRAPH_CONFIG

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

  useLayoutEffect(() => {
    const mesh = meshRef.current
    if (!mesh || data.length === 0) return

    const temp = new THREE.Object3D()
    const color = new THREE.Color()

    data.forEach((entry, index) => {
      const height =
        entry.count > 0 ? entry.count * heightUnit : MIN_BAR_HEIGHT
      const x = offsetX + entry.week * (cellSize + gap)
      const z = offsetZ + entry.day * (cellSize + gap)

      temp.position.set(x, height / 2, z)
      temp.scale.set(1, height / cellSize, 1)
      temp.updateMatrix()
      mesh.setMatrixAt(index, temp.matrix)
      mesh.setColorAt(index, color.set(getContributionColor3D(entry.count)))
    })

    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) {
      mesh.instanceColor.needsUpdate = true
    }
  }, [data, offsetX, offsetZ, cellSize, gap, heightUnit])

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <planeGeometry args={[gridWidth + 2, gridDepth + 2]} />
        <meshLambertMaterial color={FLOOR_COLOR} />
      </mesh>

      {data.length > 0 ? (
        <instancedMesh
          ref={meshRef}
          args={[undefined, undefined, data.length]}
          frustumCulled={false}
        >
          <boxGeometry args={[cellSize, cellSize, cellSize]} />
          <meshLambertMaterial color="#ffffff" vertexColors />
        </instancedMesh>
      ) : null}

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

function SceneLighting({
  gridWidth,
  gridDepth,
}: {
  gridWidth: number
  gridDepth: number
}) {
  const span = Math.max(gridWidth, gridDepth, 8)

  return (
    <>
      <ambientLight intensity={1.2} color="#f8fffb" />
      <hemisphereLight
        args={["#d4fce0", "#4a6b5c", 0.9]}
        position={[0, span, 0]}
      />
      <directionalLight
        position={[span * 0.35, span * 0.7, span * 0.4]}
        intensity={0.45}
        color="#ffffff"
      />
      <directionalLight
        position={[span * 0.5, span * 0.35, span * 0.5]}
        intensity={0.75}
        color="#eefff4"
      />
      <directionalLight
        position={[-span * 0.4, span * 0.3, -span * 0.35]}
        intensity={0.5}
        color="#c8f5d4"
      />
    </>
  )
}

export function ContributionScene({ data }: ContributionSceneProps) {
  const weeks =
    data.length === 0
      ? GRAPH_CONFIG.weeks
      : Math.max(...data.map((entry) => entry.week)) + 1
  const days =
    data.length === 0
      ? GRAPH_CONFIG.days
      : Math.max(...data.map((entry) => entry.day)) + 1
  const { cellSize, gap } = GRAPH_CONFIG
  const gridWidth = weeks * (cellSize + gap)
  const gridDepth = days * (cellSize + gap)

  return (
    <Canvas
      className="h-full w-full"
      gl={{ antialias: true }}
      dpr={[1, 2]}
    >
      <color attach="background" args={[SCENE_BACKGROUND]} />
      <SceneLighting gridWidth={gridWidth} gridDepth={gridDepth} />
      <ContributionBars data={data} />
    </Canvas>
  )
}