import { ImageResponse } from 'next/og'

export const size = {
  width: 180,
  height: 180,
}
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #08090f 0%, #ff5500 60%, #ff0055 100%)',
          borderRadius: '40px',
          fontSize: '105px',
          border: '4px solid rgba(255, 255, 255, 0.2)',
        }}
      >
        🔥
      </div>
    ),
    {
      ...size,
    }
  )
}
