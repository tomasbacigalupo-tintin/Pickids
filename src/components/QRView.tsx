import { QRCodeSVG } from 'qrcode.react'

export function QRView({ value, size = 220 }: { value: string; size?: number }) {
  return (
    <div style={{
      background: 'white', borderRadius: 16, padding: 16,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: '0 4px 14px rgba(15,23,42,0.08)',
    }}>
      <QRCodeSVG value={value} size={size} bgColor="#FFFFFF" fgColor="#0F172A" level="M" includeMargin={false} />
    </div>
  )
}
