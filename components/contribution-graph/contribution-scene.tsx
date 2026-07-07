"use client"

import {
  Instance,
  Instances,
  OrbitControls,
  OrthographicCamera,
} from "@react-three/drei"
import { Canvas } from "@react-three/fiber"
import { useMemo } from "react"

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
const FLOOR_COLOR = "#4a5568"

function ContributionBars({ data }: { data: ContributionDay[] }) {
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

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <planeGeometry args={[gridWidth + 2, gridDepth + 2]} />
        <meshBasicMaterial color={FLOOR_COLOR} toneMapped={false} />
      </mesh>

      {data.length > 0 ? (
        <Instances range={data.length} limit={data.length} frustumCulled={false}>
          <boxGeometry args={[cellSize, cellSize, cellSize]} />
          <meshBasicMaterial toneMapped={false} vertexColors />
          {data.map((entry, index) => {
            const height =
              entry.count > 0 ? entry.count * heightUnit : MIN_BAR_HEIGHT
            const x = offsetX + entry.week * (cellSize + gap)
            const z = offsetZ + entry.day * (cellSize + gap)

            return (
              <Instance
                key={`${entry.date}-${index}`}
                position={[x, height / 2, z]}
                scale={[1, height / cellSize, 1]}
                color={getContributionColor3D(entry.count)}
              />
            )
          })}
        </Instances>
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
      className="h-full w-full"
      gl={{ antialias: true }}
      dpr={[1, 2]}
    >
      <color attach="background" args={[SCENE_BACKGROUND]} />
      <ContributionBars data={data} />
    </Canvas>
  )
}