'use client'

import type { MapPoint } from '@/types/tactics'

interface PathLine {
  points: MapPoint[]
  color: string
  dashed?: boolean
}

interface Marker {
  point: MapPoint
  color: string
  label?: string
}

interface Props {
  paths: PathLine[]
  markers: Marker[]
  target?: (MapPoint & { label?: string }) | null
  width: number
  height: number
}

function toSvg(points: MapPoint[], w: number, h: number) {
  return points.map((p) => `${p.x * w},${p.y * h}`).join(' ')
}

export default function RouteOverlay({ paths, markers, target, width, height }: Props) {
  if (width <= 0 || height <= 0) return null

  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
    >
      <defs>
        {paths.map((path, i) => (
          <marker
            key={`arrow-${i}`}
            id={`tactic-arrow-${i}`}
            markerWidth="8"
            markerHeight="8"
            refX="6"
            refY="3"
            orient="auto"
          >
            <polygon points="0 0, 8 3, 0 6" fill={path.color} />
          </marker>
        ))}
      </defs>
      {paths.map((path, i) =>
        path.points.length >= 2 ? (
          <polyline
            key={`path-${i}`}
            points={toSvg(path.points, width, height)}
            fill="none"
            stroke={path.color}
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={path.dashed ? '8 6' : undefined}
            markerEnd={`url(#tactic-arrow-${i})`}
            opacity={0.9}
          />
        ) : null,
      )}
      {target && (
        <circle
          cx={target.x * width}
          cy={target.y * height}
          r={10}
          fill="none"
          stroke="#F0B429"
          strokeWidth={2}
          strokeDasharray="4 3"
        />
      )}
      {markers.map((m, i) => (
        <g key={`m-${i}`}>
          <circle
            cx={m.point.x * width}
            cy={m.point.y * height}
            r={7}
            fill={m.color}
            stroke="#0d0d0d"
            strokeWidth={2}
          />
        </g>
      ))}
    </svg>
  )
}
