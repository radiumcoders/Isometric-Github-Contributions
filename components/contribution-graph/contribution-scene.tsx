"use client"

import { OrbitControls, OrthographicCamera } from "@react-three/drei"
import { Canvas } from "@react-three/fiber"
import { useLayoutEffect, useMemo, useRef } from "react"
import * as THREE from "three"

import {
  type ContributionDay,
  getContributionColor,
  GRAPH_CONFIG,
} from "@/lib/contribution-data"

type ContributionSceneProps = {
  data: ContributionDay[]
}

const MIN_BAR_HEIGHT = 0.04

function ContributionBars({ data }: { data: ContributionDay[] }) {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const { cellSize, gap, heightUnit } = GRAPH_CONFIG

  const geometry = useMemo(
    () => new THREE.BoxGeometry(cellSize, cellSize, cellSize),
    [cellSize]
  )
  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#ffffff",
        roughness: 0.5,
        metalness: 0,
        vertexColors: true,
      }),
    []
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
      mesh.setColorAt(index, color.set(getContributionColor(entry.count)))
    })

    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) {
      mesh.instanceColor.needsUpdate = true
    }
  }, [data, offsetX, offsetZ, cellSize, gap, heightUnit])

  return (
    <group>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.01, 0]}
        receiveShadow
      >
        <planeGeometry args={[gridWidth + 2, gridDepth + 2]} />
        <meshStandardMaterial color="#0d1117" />
      </mesh>

      {data.length > 0 ? (
        <instancedMesh
          ref={meshRef}
          args={[geometry, material, data.length]}
          castShadow
          receiveShadow
          frustumCulled={false}
        />
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

export function ContributionScene({ data }: ContributionSceneProps) {
  return (
    <Canvas
      shadows
      className="h-full w-full"
      gl={{ antialias: true }}
      dpr={[1, 2]}
    >
      <color attach="background" args={["#010409"]} />
      <ambientLight intensity={0.42} />
      <directionalLight position={[0, 40, 0]} intensity={0.55} />
      <directionalLight
        position={[15, 32, 10]}
        intensity={1.65}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <directionalLight position={[-12, 18, -10]} intensity={0.65} />

      <ContributionBars data={data} />
    </Canvas>
  )
}