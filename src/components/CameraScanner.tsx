import { useState, useRef, useCallback, useEffect, type ChangeEvent } from 'react';
import { Camera, X, Check, Loader2, RefreshCw, Volume2 } from 'lucide-react';
import { useAccessibility } from '@/context/AccessibilityContext';
import { classifyMaterial } from '@/data/recyclingData';
import { MATERIAL_COLORS, MATERIAL_LABELS, type RecyclingItem } from '@/types';
import * as mobilenet from '@tensorflow-models/mobilenet';
import '@tensorflow/tfjs';

type ScanPhase = 'idle' | 'camera' | 'scanning' | 'result';

export function CameraScanner({ onResult }: { onResult?: (item: RecyclingItem) => void }) {
  const { speak, stopSpeaking, isSpeaking } = useAccessibility();
  const [phase, setPhase] = useState<ScanPhase>('idle');
  const [error, setError] = useState('');
  const [detectedItem, setDetectedItem] = useState<RecyclingItem | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const modelRef = useRef<Promise<mobilenet.MobileNet> | null>(null);

  const getModel = () => {
    if (!modelRef.current) modelRef.current = mobilenet.load();
    return modelRef.current;
  };

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
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('unsupported');
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

  const analyzeImage = async (image: HTMLCanvasElement | HTMLImageElement) => {
    setPhase('scanning');
    try {
      const predictions = await (await getModel()).classify(image, 5);
      const prediction = predictions[0];
      if (!prediction) throw new Error('empty');
      const item = classifyMaterial(predictions.map((result) => result.className).join(' '));
      setDetectedItem(item);
      setConfidence(prediction.probability);
      setPhase('result');
      onResult?.(item);
      speak(`${item.name}. Categoría: ${MATERIAL_LABELS[item.category]}. ${item.steps.join(' ')}`);
    } catch {
      setError('No se pudo analizar la imagen. Comprueba tu conexión e inténtalo de nuevo.');
      setPhase('idle');
    }
  };

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    stopCamera();
    await analyzeImage(canvas);
  };

  const handleGalleryImage = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const image = new Image();
    image.onload = async () => { await analyzeImage(image); URL.revokeObjectURL(image.src); };
    image.onerror = () => { setError('No se pudo leer esa fotografía.'); setPhase('idle'); };
    image.src = URL.createObjectURL(file);
  };

  const speakResult = () => {
    if (!detectedItem) return;
    speak(`${detectedItem.name}. Paso 1: ${detectedItem.steps[0]} Paso 2: ${detectedItem.steps[1]} Paso 3: ${detectedItem.steps[2]}`);
  };

  const reset = () => {
    stopSpeaking();
    setDetectedItem(null);
    setConfidence(null);
    setError('');
    setPhase('idle');
  };

  const close = () => {
    stopCamera();
    stopSpeaking();
    setDetectedItem(null);
    setConfidence(null);
    setError('');
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
      <div className="eco-card flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-forest-100 text-forest-700 dark:bg-forest-900 dark:text-forest-300"><Camera size={24} /></span>
        <div className="min-w-0 flex-1"><p className="font-bold">Escáner inteligente</p><p className="text-sm text-[var(--eco-text-muted)]">Analiza un objeto con cámara o fotografía.</p></div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button onClick={startCamera} className="eco-btn"><Camera size={18} /> Cámara</button>
          <label className="eco-btn-outline cursor-pointer"><input className="sr-only" type="file" accept="image/*" onChange={handleGalleryImage} /> Foto</label>
        </div>
      </div>
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
                {confidence !== null && <p className="text-xs text-[var(--eco-text-muted)]">Confianza del modelo: {Math.round(confidence * 100)}%</p>}
                <p className="text-xs font-semibold" style={{ color: MATERIAL_COLORS[detectedItem.category] }}>Contenedor recomendado: {MATERIAL_LABELS[detectedItem.category]}. Confirma el color local.</p>
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
