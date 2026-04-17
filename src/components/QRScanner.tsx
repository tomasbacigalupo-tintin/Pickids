import { useEffect, useRef, useState } from 'react'
import jsQR from 'jsqr'
import { Camera, FlashlightOff, Flashlight, X } from 'lucide-react'
import { Button, Input } from './ui'
import './qr-scanner.css'

export function QRScanner(props: { onDetect: (value: string) => void; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const rafRef = useRef<number | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [flash, setFlash] = useState(false)
  const [manual, setManual] = useState('')

  useEffect(() => {
    let stopped = false
    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        if (stopped) { stream.getTracks().forEach(t => t.stop()); return }
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
        }
        tick()
      } catch (e: any) {
        setErr(e?.message ?? 'No se pudo acceder a la cámara')
      }
    }
    function tick() {
      if (!videoRef.current || !canvasRef.current) {
        rafRef.current = requestAnimationFrame(tick); return
      }
      const v = videoRef.current
      if (v.readyState === v.HAVE_ENOUGH_DATA) {
        const c = canvasRef.current
        c.width = v.videoWidth; c.height = v.videoHeight
        const ctx = c.getContext('2d', { willReadFrequently: true })
        if (ctx) {
          ctx.drawImage(v, 0, 0, c.width, c.height)
          const data = ctx.getImageData(0, 0, c.width, c.height)
          const code = jsQR(data.data, data.width, data.height)
          if (code && code.data) {
            stop()
            props.onDetect(code.data)
            return
          }
        }
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    function stop() {
      stopped = true
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      streamRef.current?.getTracks().forEach(t => t.stop())
    }
    start()
    return stop
  }, [props])

  async function toggleFlash() {
    const track = streamRef.current?.getVideoTracks()[0]
    if (!track) return
    try {
      await track.applyConstraints({ advanced: [{ torch: !flash } as any] })
      setFlash(!flash)
    } catch { /* no torch support */ }
  }

  return (
    <div className="pk-qrs">
      <div className="pk-qrs__top">
        <button className="pk-qrs__btn" onClick={props.onClose}><X size={20} /></button>
        <div className="pk-qrs__title">Acercá el código del padre</div>
        <button className="pk-qrs__btn" onClick={toggleFlash}>{flash ? <Flashlight size={20} /> : <FlashlightOff size={20} />}</button>
      </div>
      <div className="pk-qrs__viewport">
        {!err ? (
          <>
            <video ref={videoRef} playsInline muted />
            <canvas ref={canvasRef} style={{ display: 'none' }} />
            <div className="pk-qrs__frame" />
          </>
        ) : (
          <div className="pk-qrs__fallback">
            <Camera size={36} />
            <p>No se pudo acceder a la cámara.</p>
            <small>{err}</small>
          </div>
        )}
      </div>
      <div className="pk-qrs__manual">
        <Input label="O pegá el token manualmente" value={manual} onChange={setManual} placeholder="qr-XXXX..." />
        <Button variant="primary" fullWidth disabled={!manual} onClick={() => manual && props.onDetect(manual)}>Usar código</Button>
      </div>
    </div>
  )
}
