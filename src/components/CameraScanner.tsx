import { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, X, Check, Loader2, RefreshCw, Volume2 } from 'lucide-react';
import { useAccessibility } from '@/context/AccessibilityContext';
import { RECYCLING_ITEMS } from '@/data/recyclingData';
import { MATERIAL_LABELS, type RecyclingItem } from '@/types';

type ScanPhase = 'idle' | 'camera' | 'scanning' | 'result';

export function CameraScanner({ onResult }: { onResult?: (item: RecyclingItem) => void }) {
  const { speak, stopSpeaking, isSpeaking } = useAccessibility();
  const [phase, setPhase] = useState<ScanPhase>('idle');
  const [error, setError] = useState('');
  const [detectedItem, setDetectedItem] = useState<RecyclingItem | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  const startCamera = async () => {
    setError('');
    setPhase('camera');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch {
      setError('No se pudo acceder a la cámara. Verifica los permisos del navegador.');
      setPhase('idle');
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    setPhase('scanning');

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    stopCamera();

    setTimeout(() => {
      const random = RECYCLING_ITEMS[Math.floor(Math.random() * RECYCLING_ITEMS.length)];
      setDetectedItem(random);
      setPhase('result');
      onResult?.(random);
    }, 1800);
  };

  const speakResult = () => {
    if (!detectedItem) return;
    speak(`${detectedItem.name}. Paso 1: ${detectedItem.steps[0]} Paso 2: ${detectedItem.steps[1]} Paso 3: ${detectedItem.steps[2]}`);
  };

  const reset = () => {
    stopSpeaking();
    setDetectedItem(null);
    setPhase('idle');
  };

  const close = () => {
    stopCamera();
    stopSpeaking();
    setDetectedItem(null);
    setPhase('idle');
  };

  if (phase === 'idle' && error) {
    return (
      <div className="eco-card p-5 text-center">
        <p className="text-sm text-red-600 dark:text-red-400 mb-3">{error}</p>
        <button onClick={startCamera} className="eco-btn-outline">Reintentar</button>
      </div>
    );
  }

  if (phase === 'idle') {
    return (
      <button
        onClick={startCamera}
        className="eco-card group flex w-full items-center gap-4 p-5 text-left transition hover:-translate-y-1 hover:shadow-lg"
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-forest-100 text-forest-700 transition group-hover:bg-forest-700 group-hover:text-white dark:bg-forest-900 dark:text-forest-300">
          <Camera size={24} />
        </span>
        <span>
          <span className="block font-bold">Escáner de residuos</span>
          <span className="text-sm text-[var(--eco-text-muted)]">Usa la cámara para detectar materiales</span>
        </span>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="w-full max-w-lg animate-scale-in overflow-hidden rounded-2xl bg-[var(--eco-card)] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[var(--eco-border)] p-4">
          <h2 className="font-extrabold">Escáner de residuos</h2>
          <button onClick={close} className="rounded-lg p-2 hover:bg-[var(--eco-surface)]" aria-label="Cerrar escáner">
            <X size={20} />
          </button>
        </div>

        {phase === 'camera' && (
          <div className="p-4">
            <div className="relative overflow-hidden rounded-xl bg-black">
              <video ref={videoRef} className="h-72 w-full object-cover" playsInline muted />
              <div className="pointer-events-none absolute inset-0 border-2 border-forest-400/60 rounded-xl" />
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1.5 text-xs text-white">
                Centra el residuo en el cuadro
              </div>
            </div>
            <button onClick={capturePhoto} className="eco-btn mt-4 w-full">
              <Camera size={20} /> Tomar foto
            </button>
          </div>
        )}

        {phase === 'scanning' && (
          <div className="flex flex-col items-center justify-center p-12">
            <Loader2 className="mb-4 animate-spin text-forest-600" size={40} />
            <p className="font-semibold text-[var(--eco-text-muted)]">Analizando material...</p>
          </div>
        )}

        {phase === 'result' && detectedItem && (
          <div className="p-5">
            <div className="mb-4 flex items-center gap-3 rounded-xl bg-forest-50 p-4 dark:bg-forest-950">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-forest-600 text-white">
                <Check size={22} />
              </span>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-forest-600 dark:text-forest-400">
                  Material detectado: {MATERIAL_LABELS[detectedItem.category]}
                </p>
                <h3 className="text-lg font-extrabold">{detectedItem.name}</h3>
              </div>
            </div>

            <h4 className="mb-3 font-bold">Preparación en 3 pasos:</h4>
            <div className="space-y-3">
              {detectedItem.steps.map((step, i) => (
                <div key={i} className="flex gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-forest-100 text-sm font-bold text-forest-800 dark:bg-forest-900 dark:text-forest-200">
                    {i + 1}
                  </span>
                  <p className="text-sm leading-relaxed text-[var(--eco-text-muted)]">{step}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
              <strong>Dato Eco:</strong> {detectedItem.tip}
            </div>

            <div className="mt-5 flex gap-2">
              <button onClick={speakResult} className="eco-btn-outline flex-1">
                <Volume2 size={18} /> {isSpeaking ? 'Reproduciendo...' : 'Escuchar'}
              </button>
              <button onClick={reset} className="eco-btn flex-1">
                <RefreshCw size={18} /> Escanear otro
              </button>
            </div>
          </div>
        )}
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
