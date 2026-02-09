/**
 * Camp Connect - FaceTagOverlay
 * Renders bounding boxes over a photo for detected faces.
 */

import type { FaceTag } from '@/types'

interface FaceTagOverlayProps {
  photoUrl: string
  faceTags: FaceTag[]
  imageWidth: number
  imageHeight: number
}

export function FaceTagOverlay({ photoUrl, faceTags, imageWidth, imageHeight }: FaceTagOverlayProps) {
  return (
    <div className="relative inline-block" style={{ width: imageWidth, height: imageHeight }}>
      <img
        src={photoUrl}
        alt="Photo with face tags"
        className="block h-full w-full object-contain"
      />

      {faceTags.map((tag) => {
        if (!tag.bounding_box) return null

        const { Left, Top, Width, Height } = tag.bounding_box

        return (
          <div
            key={tag.id}
            className="absolute"
            style={{
              left: `${Left * 100}%`,
              top: `${Top * 100}%`,
              width: `${Width * 100}%`,
              height: `${Height * 100}%`,
            }}
          >
            {/* Bounding box */}
            <div className="h-full w-full rounded-sm border-2 border-emerald-400" />

            {/* Label */}
            <div className="absolute -bottom-6 left-0 flex items-center gap-1 whitespace-nowrap rounded bg-emerald-500/90 px-1.5 py-0.5">
              <span className="text-[10px] font-medium text-white">
                {tag.camper_name || 'Unknown'}
              </span>
              {tag.confidence != null && (
                <span className="text-[9px] text-emerald-100">
                  {Math.round(tag.confidence)}%
                </span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
