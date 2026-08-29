import { useState, useEffect, useRef, useCallback } from 'react';
import { useAccessibility } from '@/context/AccessibilityContext';
import { useSpeech } from '@/hooks/useSpeech';
import { useRecyclingLog } from '@/hooks/useRecyclingLog';
import { classifyMaterial } from '@/data/recyclingData';
import { MATERIAL_CONTAINERS, MATERIAL_LABELS, type RecyclingItem } from '@/types';
import { X, Mic, Search, Camera, BookOpen, Map, Trophy, Volume2, Square, Sparkles, Leaf, Recycle, Zap, CheckCircle2 } from 'lucide-react';

type MascotMode = 'idle' | 'chat' | 'search' | 'result';

interface EcoMascotaProps {
  onNavigate: (tab: 'home' | 'map' | 'guide' | 'achievements' | 'scanner') => void;
  detectedItem?: RecyclingItem | null;
}

export function EcoMascota({ onNavigate, detectedItem }: EcoMascotaProps) {
  const { speak, stopSpeaking, isSpeaking } = useAccessibility();
  const { startListening, stopListening, isListening, transcript } = useSpeech();
  const { stats } = useRecyclingLog();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<MascotMode>('idle');
  const [foundItem, setFoundItem] = useState<RecyclingItem | null>(null);
  const [query, setQuery] = useState('');
  const [bubbleText, setBubbleText] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const greetedRef = useRef(false);

  // Mostrar hint después de 5 segundos si no está abierto
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!open && !greetedRef.current) {
        setShowHint(true);
        setTimeout(() => setShowHint(false), 5000);
      }
    }, 5000);
    return () => clearTimeout(timer);
  }, [open]);

  // Procesar transcripción de voz
  useEffect(() => {
    if (transcript && transcript.trim()) {
      setQuery(transcript);
      searchItem(transcript);
    }
  }, [transcript]);

  // Procesar item detectado (desde cámara)
  useEffect(() => {
    if (!detectedItem) return;
    setFoundItem(detectedItem);
    setOpen(true);
    setMode('result');
    setBubbleText(`Detecté ${detectedItem.name}. Te explico cómo prepararlo.`);
    const speakText = `Detecté ${detectedItem.name}. Categoría: ${MATERIAL_LABELS[detectedItem.category]}. ${MATERIAL_CONTAINERS[detectedItem.category]}. ${detectedItem.steps.join(' ')} ${detectedItem.upcycling ?? detectedItem.tip}`;
    speak(speakText);
  }, [detectedItem, speak]);

  const searchItem = useCallback((q: string) => {
    const query = q.trim().toLowerCase();
    if (!query) return;
    
    setIsSearching(true);
    try {
      const found = classifyMaterial(q);
      if (found) {
        setFoundItem(found);
        setMode('result');
        setBubbleText(`¡Encontré ${found.name}! Te explico cómo reciclarlo.`);
        const speakText = `¡Encontré ${found.name}! Categoría: ${MATERIAL_LABELS[found.category]}. ${MATERIAL_CONTAINERS[found.category]}. ${found.steps.join(' ')} ${found.upcycling ?? found.tip}`;
        speak(speakText);
      } else {
        setBubbleText('No reconozco ese material. Intenta con otro nombre.');
      }
    } catch (error) {
      console.error('Error searching item:', error);
      setBubbleText('Ocurrió un error. Intenta de nuevo.');
    } finally {
      setIsSearching(false);
    }
  }, [speak]);

  const handleOpen = useCallback(() => {
    if (!open) {
      setOpen(true);
      greetedRef.current = true;
      setShowHint(false);
      setMode('chat');
      setBubbleText('¡Hola! Soy EcoVerde, tu asistente de reciclaje. ¿Qué necesitas?');
      speak('¡Hola! Soy EcoVerde, tu asistente de reciclaje. ¿Qué quieres reciclar hoy?');
    } else {
      handleClose();
    }
  }, [open, speak]);

  const handleClose = useCallback(() => {
    setOpen(false);
    stopSpeaking();
    stopListening();
    setMode('idle');
    setFoundItem(null);
    setQuery('');
  }, [stopSpeaking, stopListening]);

  const handleDictate = useCallback(() => {
    stopSpeaking();
    setMode('search');
    startListening();
  }, [stopSpeaking, startListening]);

  const handleSearch = useCallback(() => {
    if (query.trim()) searchItem(query);
  }, [query, searchItem]);

  const handleNavigate = useCallback((tab: 'home' | 'map' | 'guide' | 'achievements' | 'scanner') => {
    handleClose();
    onNavigate(tab);
  }, [handleClose, onNavigate]);

  const speakSteps = useCallback(() => {
    if (foundItem) {
      speak(`Paso 1: ${foundItem.steps[0]} Paso 2: ${foundItem.steps[1]} Paso 3: ${foundItem.steps[2]}`);
    }
  }, [foundItem, speak]);

  const quickActions = [
    { icon: Map, label: 'Mapa', tab: 'map' as const, color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' },
    { icon: BookOpen, label: 'Guía', tab: 'guide' as const, color: 'bg-forest-100 text-forest-700 dark:bg-forest-900 dark:text-forest-300' },
    { icon: Camera, label: 'Escáner', tab: 'scanner' as const, color: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300' },
    { icon: Trophy, label: 'Logros', tab: 'achievements' as const, color: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300' },
  ];

  return (
    <>
      {showHint && !open && (
        <div className="fixed bottom-28 right-24 z-50 animate-slide-up rounded-2xl bg-forest-700 px-4 py-3 text-sm font-semibold text-white shadow-xl lg:bottom-12">
          <div className="absolute -right-1 bottom-4 h-3 w-3 rotate-45 bg-forest-700" />
          ¡Toca aquí y te ayudo a reciclar!
        </div>
      )}

      <button
        onClick={handleOpen}
        className="fixed bottom-24 right-5 z-50 flex items-center justify-center rounded-full bg-gradient-to-br from-forest-500 via-forest-600 to-mint-600 text-white shadow-2xl transition hover:scale-110 active:scale-95 lg:bottom-8"
        style={{ height: '72px', width: '72px' }}
        aria-label="EcoVerde - Asistente virtual de reciclaje"
      >
        {!open && (
          <>
            <span className="absolute inset-0 animate-pulse-ring rounded-full bg-forest-400/40" />
            <span className="absolute inset-0 animate-pulse rounded-full bg-forest-400/20" style={{ animationDelay: '0.5s' }} />
          </>
        )}
        <span className="relative text-3xl">{open ? '😊' : '🌱'}</span>
      </button>

      {open && (
        <div className="fixed bottom-44 right-5 z-50 w-80 max-w-[calc(100vw-2.5rem)] animate-slide-up overflow-hidden rounded-3xl border border-[var(--eco-border)] bg-[var(--eco-card)] shadow-2xl lg:bottom-28">
          <div className="relative bg-gradient-to-br from-forest-700 to-mint-700 p-5 text-white">
            <button
              onClick={handleClose}
              className="absolute right-3 top-3 rounded-full bg-white/20 p-1.5 transition hover:bg-white/30"
              aria-label="Cerrar asistente"
            >
              <X size={18} />
            </button>
            <div className="flex items-center gap-3">
              <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-white/20 text-3xl">
                <span className="absolute inset-0 animate-ping rounded-full bg-white/20" style={{ animationDuration: '2s' }} />
                <span className="relative">🌱</span>
              </div>
              <div>
                <p className="text-lg font-extrabold">EcoVerde</p>
                <p className="text-xs text-forest-100">Tu asistente de reciclaje</p>
                <div className="mt-1 flex items-center gap-1.5 text-xs">
                  <span className="flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5">
                    <Zap size={11} /> {stats.points} pts
                  </span>
                  <span className="flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5">
                    <Recycle size={11} /> {stats.total} reciclados
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="max-h-[60vh] overflow-y-auto p-5">
            {mode === 'chat' && (
              <div className="space-y-4">
                <div className="flex gap-2">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-forest-100 text-lg dark:bg-forest-900">🌱</span>
                  <div className="rounded-2xl rounded-tl-sm bg-[var(--eco-surface)] p-3 text-sm leading-relaxed text-[var(--eco-text)]">
                    {bubbleText}
                  </div>
                </div>

                <div className="relative">
                  <Search className="absolute left-3 top-3.5 text-[var(--eco-text-muted)]" size={18} />
                  <input
                    className="eco-input pl-10"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="Escribe tu residuo..."
                    aria-label="Buscar residuo"
                  />
                </div>

                <button
                  onClick={handleDictate}
                  disabled={isListening}
                  className={`eco-btn w-full ${isListening ? 'bg-red-600' : ''}`}
                >
                  <Mic size={16} /> {isListening ? 'Escuchando...' : 'Hablar'}
                </button>

                <div className="flex gap-1.5">
                  {quickActions.map(({ icon: Icon, label, tab, color }) => (
                    <button
                      key={tab}
                      onClick={() => handleNavigate(tab)}
                      className={`flex flex-1 flex-col items-center gap-1 rounded-lg px-2 py-2 text-xs font-semibold transition ${color}`}
                    >
                      <Icon size={16} />
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {mode === 'result' && foundItem && (
              <div className="space-y-4">
                <div className="flex gap-2">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-forest-100 text-lg dark:bg-forest-900">✨</span>
                  <div className="rounded-2xl rounded-tl-sm bg-[var(--eco-surface)] p-3 text-sm leading-relaxed text-[var(--eco-text)]">
                    {bubbleText}
                  </div>
                </div>

                <div className="rounded-xl bg-[var(--eco-surface)] p-4">
                  <p className="mb-2 text-xs font-bold text-forest-600 dark:text-forest-400">
                    {MATERIAL_LABELS[foundItem.category]}
                  </p>
                  <h3 className="mb-3 text-lg font-extrabold">{foundItem.name}</h3>

                  <div className="mb-4 space-y-2">
                    <p className="text-xs font-bold text-forest-600 dark:text-forest-400">Pasos:</p>
                    {foundItem.steps.map((step, i) => (
                      <p key={i} className="flex gap-2 text-xs leading-relaxed text-[var(--eco-text-muted)]">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-forest-700 text-[10px] font-bold text-white">
                          {i + 1}
                        </span>
                        {step}
                      </p>
                    ))}
                  </div>

                  <div className="rounded-lg bg-amber-50 p-2 text-[10px] text-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
                    💡 {foundItem.tip}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button onClick={speakSteps} className="eco-btn-outline flex-1">
                    <Volume2 size={14} /> Escuchar
                  </button>
                  <button onClick={() => setMode('chat')} className="eco-btn-outline flex-1">
                    <Search size={14} /> Otro
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

      <button
        onClick={handleOpen}
        className="fixed bottom-24 right-5 z-50 flex items-center justify-center rounded-full bg-gradient-to-br from-forest-500 via-forest-600 to-mint-600 text-white shadow-2xl transition hover:scale-110 active:scale-95 lg:bottom-8"
        style={{ height: '72px', width: '72px' }}
        aria-label="EcoVerde - Asistente virtual de reciclaje"
      >
        {!open && (
          <>
            <span className="absolute inset-0 animate-pulse-ring rounded-full bg-forest-400/40" />
            <span className="absolute inset-0 animate-pulse rounded-full bg-forest-400/20" style={{ animationDelay: '0.5s' }} />
          </>
        )}
        <span className="relative text-3xl">{open ? '😊' : '🌱'}</span>
      </button>

      {open && (
        <div className="fixed bottom-44 right-5 z-50 w-80 max-w-[calc(100vw-2.5rem)] animate-slide-up overflow-hidden rounded-3xl border border-[var(--eco-border)] bg-[var(--eco-card)] shadow-2xl lg:bottom-28">
          <div className="relative bg-gradient-to-br from-forest-700 to-mint-700 p-5 text-white">
            <button
              onClick={handleClose}
              className="absolute right-3 top-3 rounded-full bg-white/20 p-1.5 transition hover:bg-white/30"
              aria-label="Cerrar asistente"
            >
              <X size={18} />
            </button>
            <div className="flex items-center gap-3">
              <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-white/20 text-3xl">
                <span className="absolute inset-0 animate-ping rounded-full bg-white/20" style={{ animationDuration: '2s' }} />
                <span className="relative">🌱</span>
              </div>
              <div>
                <p className="text-lg font-extrabold">EcoVerde</p>
                <p className="text-xs text-forest-100">Tu asistente de reciclaje</p>
                <div className="mt-1 flex items-center gap-1.5 text-xs">
                  <span className="flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5">
                    <Zap size={11} /> {stats.points} pts
                  </span>
                  <span className="flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5">
                    <Recycle size={11} /> {stats.total} reciclados
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="max-h-[60vh] overflow-y-auto p-5">
            {mode === 'chat' && (
              <div className="space-y-4">
                <div className="flex gap-2">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-forest-100 text-lg dark:bg-forest-900">🌱</span>
                  <div className="rounded-2xl rounded-tl-sm bg-[var(--eco-surface)] p-3 text-sm leading-relaxed text-[var(--eco-text)]">
                    {bubbleText}
                  </div>
                </div>

                <div className="relative">
                  <Search className="absolute left-3 top-3.5 text-[var(--eco-text-muted)]" size={18} />
                  <input
                    className="eco-input pl-10"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="Escribe tu residuo..."
                    aria-label="Buscar residuo"
                  />
                </div>

                <button
                  onClick={handleDictate}
                  className={`eco-btn w-full ${isListening ? 'bg-red-600' : ''}`}
                >
                  <Mic size={20} /> {isListening ? 'Escuchando...' : 'Dictar por voz'}
                </button>

                <div>
                  <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[var(--eco-text-muted)]">Accesos rápidos</p>
                  <div className="grid grid-cols-4 gap-2">
                    {quickActions.map((action) => (
                      <button
                        key={action.label}
                        onClick={() => handleNavigate(action.tab)}
                        className={`flex flex-col items-center gap-1.5 rounded-xl p-3 text-xs font-semibold transition hover:scale-105 ${action.color}`}
                      >
                        <action.icon size={20} />
                        {action.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl bg-amber-50 p-3 text-xs text-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
                  <strong>Dato del día:</strong> Reciclar una lata de aluminio ahorra energía para mantener un TV encendido 3 horas.
                </div>
              </div>
            )}

            {mode === 'search' && (
              <div className="flex flex-col items-center justify-center py-8">
                <div className="relative mb-4 flex h-16 w-16 items-center justify-center">
                  <span className="absolute inset-0 animate-ping rounded-full bg-red-400/40" />
                  <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-red-500 text-white">
                    <Mic size={28} />
                  </span>
                </div>
                <p className="font-bold text-[var(--eco-text)]">Escuchando...</p>
                <p className="text-sm text-[var(--eco-text-muted)]">Di el nombre de tu residuo</p>
                <button onClick={() => { stopListening(); setMode('chat'); }} className="eco-btn-outline mt-4">
                  Cancelar
                </button>
              </div>
            )}

            {mode === 'result' && foundItem && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 rounded-xl bg-forest-50 p-3 dark:bg-forest-950">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-forest-600 text-white">
                    <Leaf size={20} />
                  </span>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-forest-600 dark:text-forest-400">
                      {MATERIAL_LABELS[foundItem.category]}
                    </p>
                    <h3 className="font-extrabold">{foundItem.name}</h3>
                    <p className="text-xs font-semibold" style={{ color: MATERIAL_COLORS[foundItem.category] }}>{MATERIAL_CONTAINERS[foundItem.category]}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  {foundItem.steps.map((step, i) => (
                    <div key={i} className="flex gap-2.5">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-forest-100 text-xs font-bold text-forest-800 dark:bg-forest-900 dark:text-forest-200">
                        {i + 1}
                      </span>
                      <p className="text-sm leading-relaxed text-[var(--eco-text-muted)]">{step}</p>
                    </div>
                  ))}
                </div>

                <div className="rounded-xl bg-amber-50 p-3 text-xs text-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
                  <strong>Dato Eco:</strong> {foundItem.tip}
                </div>
                <div className="rounded-xl bg-forest-50 p-3 text-xs text-forest-900 dark:bg-forest-950/40 dark:text-forest-100">
                  <strong>Reutilización:</strong> {foundItem.upcycling ?? 'Reutilízalo o dónalo antes de reciclarlo si está en buen estado.'}
                </div>

                <div className="flex gap-2">
                  <button onClick={speakSteps} className="eco-btn-outline flex-1 text-sm">
                    <Volume2 size={16} /> {isSpeaking ? 'Reproduciendo...' : 'Escuchar'}
                  </button>
                  {isSpeaking && (
                    <button onClick={stopSpeaking} className="eco-btn-outline text-sm" aria-label="Detener">
                      <Square size={16} />
                    </button>
                  )}
                </div>
                <button onClick={() => { setMode('chat'); setFoundItem(null); setQuery(''); }} className="eco-btn w-full text-sm">
                  <Sparkles size={16} /> Buscar otro residuo
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
