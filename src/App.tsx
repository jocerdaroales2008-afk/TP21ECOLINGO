import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  Accessibility,
  Award,
  Bell,
  BookOpen,
  Box,
  Camera,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  Disc3,
  FileText,
  Globe2,
  GraduationCap,
  HelpCircle,
  Home,
  Leaf,
  Map as MapIcon,
  MapPin,
  MapPinned,
  Menu,
  Mic,
  Navigation,
  Pause,
  Plus,
  Recycle,
  Search,
  Settings,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Sprout,
  Square,
  Trophy,
  Volume2,
  Waves,
  Wine,
  X,
  Zap,
  type LucideIcon,
} from 'lucide-react';

import { classifyMaterial, MATERIAL_GUIDES, RECYCLING_ITEMS } from '@/data/recyclingData';
import { ACHIEVEMENTS, COMPLEMENTARY_TECH, IMPACT_STATS } from '@/data/locations';
import {
  MATERIAL_COLORS,
  MATERIAL_CONTAINERS,
  MATERIAL_LABELS,
  type CleanPoint,
  type MaterialCategory,
  type RecyclingItem,
} from '@/types';
import { AccessibilityProvider, useAccessibility, type ColorBlindnessMode, type ThemeMode } from '@/context/AccessibilityContext';
import { useGeolocation, formatDistance, haversineDistance } from '@/hooks/useGeolocation';
import { useSpeech } from '@/hooks/useSpeech';
import { useRecyclingLog } from '@/hooks/useRecyclingLog';
import { EcoMascota } from '@/components/EcoMascota';
import { CameraScanner } from '@/components/CameraScanner';
import { MapView } from '@/components/MapView';
import { SpeakButton } from '@/components/SpeakButton';

type Tab = 'home' | 'map' | 'guide' | 'achievements' | 'accessibility' | 'scanner';

const iconMap: Record<string, LucideIcon> = {
  leaf: Leaf,
  'file-text': FileText,
  recycle: Recycle,
  wine: Wine,
  disc: Disc3,
  smartphone: Smartphone,
  battery: Zap,
  box: Box,
  package: Box,
  sprout: Sprout,
  shield: ShieldCheck,
  crown: Award,
  palette: Sparkles,
  waves: Waves,
  globe: Globe2,
  'help-circle': HelpCircle,
  accessibility: Accessibility,
  'check-circle': CheckCircle2,
  trophy: Trophy,
  mic: Mic,
  map: MapIcon,
  presentation: GraduationCap,
  'building-2': Settings,
  camera: Camera,
  home: Home,
  'map-pin': MapPin,
  settings: Settings,
  bell: Bell,
};

function Icon({ name, size = 20 }: { name: string; size?: number }) {
  const Component = iconMap[name] ?? Recycle;
  return <Component size={size} strokeWidth={1.9} />;
}

function AppShell() {
  const [tab, setTab] = useState<Tab>('home');
  const [menuOpen, setMenuOpen] = useState(false);
  const { logs, addLog, stats } = useRecyclingLog();
  const [selectedItem, setSelectedItem] = useState<RecyclingItem | null>(null);

  useEffect(() => {
    const current = window.history.state?.tab as Tab | undefined;
    if (current) setTab(current);
    else window.history.replaceState({ tab: 'home' }, '', window.location.href);

    const onPop = (event: PopStateEvent) => {
      setTab((event.state?.tab as Tab | undefined) ?? 'home');
    };

    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const navigate = (next: Tab) => {
    if (next !== tab) window.history.pushState({ tab: next }, '', `#${next}`);
    setTab(next);
    setMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[var(--eco-bg)] text-[var(--eco-text)] transition-colors duration-300">
      <div className="flex">
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-[var(--eco-border)] bg-[var(--eco-card)] p-5 lg:flex lg:flex-col">
          <button onClick={() => navigate('home')} className="mb-8 flex items-center gap-3 text-left" aria-label="Inicio">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-forest-800 text-white shadow-sm">
              <Recycle size={24} />
            </span>
            <span>
              <span className="block text-lg font-extrabold tracking-tight text-forest-900 dark:text-forest-100">
                Eco<span className="text-forest-600 dark:text-forest-400">Lingo</span>
              </span>
              <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--eco-text-muted)]">
                Reciclaje para todos
              </span>
            </span>
          </button>

          <nav className="flex flex-1 flex-col gap-1">
            {(['home', 'map', 'guide', 'achievements', 'scanner', 'accessibility'] as Tab[]).map((key) => (
              <button
                key={key}
                onClick={() => navigate(key)}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold transition ${
                  tab === key ? 'bg-forest-100 text-forest-800 dark:bg-forest-900 dark:text-forest-200' : 'text-[var(--eco-text-muted)] hover:bg-[var(--eco-surface)]'
                }`}
              >
                <Icon
                  name={
                    key === 'home'
                      ? 'leaf'
                      : key === 'map'
                        ? 'map'
                        : key === 'guide'
                          ? 'file-text'
                          : key === 'achievements'
                            ? 'trophy'
                            : key === 'scanner'
                              ? 'camera'
                              : 'accessibility'
                  }
                  size={20}
                />
                {tabLabel(key)}
              </button>
            ))}
          </nav>

          <div className="mt-auto space-y-3">
            <div className="flex items-center gap-2 rounded-full bg-forest-50 px-4 py-2 text-sm font-semibold text-forest-800 dark:bg-forest-900 dark:text-forest-200">
              <Zap size={16} className="text-forest-600" />
              {stats.points} puntos
            </div>
            <button className="flex w-full items-center gap-2 rounded-xl p-3 text-sm font-semibold text-[var(--eco-text-muted)] hover:bg-[var(--eco-surface)]" aria-label="Notificaciones">
              <Bell size={20} /> Notificaciones
            </button>
          </div>
        </aside>

        <div className="flex-1">
          <header className="sticky top-0 z-40 border-b border-[var(--eco-border)] bg-[var(--eco-bg)]/95 backdrop-blur-md lg:hidden">
            <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 sm:px-8">
              <button onClick={() => navigate('home')} className="flex items-center gap-3 text-left" aria-label="Ir al inicio">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-forest-800 text-white shadow-sm">
                  <Recycle size={24} />
                </span>
                <span>
                  <span className="block text-lg font-extrabold tracking-tight text-forest-900 dark:text-forest-100">
                    Eco<span className="text-forest-600 dark:text-forest-400">Lingo</span>
                  </span>
                  <span className="hidden text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--eco-text-muted)] sm:block">
                    Reciclaje para todos
                  </span>
                </span>
              </button>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 rounded-full bg-forest-50 px-3 py-2 text-sm font-semibold text-forest-800 dark:bg-forest-900 dark:text-forest-200">
                  <Zap size={16} className="text-forest-600" />
                  {stats.points}
                </div>
                <button className="rounded-xl p-3 hover:bg-[var(--eco-surface)]" onClick={() => setMenuOpen((value) => !value)} aria-label="Abrir menú">
                  <Menu size={24} />
                </button>
              </div>
            </div>

            {menuOpen && (
              <div className="border-t border-[var(--eco-border)] bg-[var(--eco-bg)] p-3 lg:hidden">
                <div className="grid grid-cols-2 gap-2">
                  {(['home', 'map', 'guide', 'achievements', 'scanner', 'accessibility'] as Tab[]).map((key) => (
                    <button key={key} onClick={() => navigate(key)} className="flex items-center gap-2 rounded-xl p-3 text-left text-sm font-semibold hover:bg-[var(--eco-surface)]">
                      <Icon
                        name={
                          key === 'home'
                            ? 'leaf'
                            : key === 'map'
                              ? 'map'
                              : key === 'guide'
                                ? 'file-text'
                                : key === 'achievements'
                                  ? 'trophy'
                                  : key === 'scanner'
                                    ? 'camera'
                                    : 'accessibility'
                        }
                        size={18}
                      />
                      {tabLabel(key)}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </header>

          <main className="mx-auto max-w-5xl px-5 pb-28 pt-6 sm:px-8 sm:pt-8 lg:pb-12">
            {tab === 'home' && <HomePage onNavigate={navigate} selectedItem={selectedItem} setSelectedItem={setSelectedItem} addLog={addLog} />}
            {tab === 'map' && <MapPage />}
            {tab === 'guide' && <GuidePage />}
            {tab === 'achievements' && <AchievementsPage logs={logs} stats={stats} onLog={addLog} />}
            {tab === 'scanner' && <ScannerPage onResult={setSelectedItem} />}
            {tab === 'accessibility' && <AccessibilityPage />}
          </main>
        </div>
      </div>

      <BottomNav tab={tab} onNavigate={navigate} />
      <EcoMascota onNavigate={navigate} detectedItem={selectedItem} />
    </div>
  );
}

function tabLabel(tab: Tab) {
  return {
    home: 'Inicio',
    map: 'Mapa',
    guide: 'Guía',
    achievements: 'Logros',
    scanner: 'Escáner',
    accessibility: 'Ajustes',
  }[tab];
}

function HomePage({
  onNavigate,
  selectedItem,
  setSelectedItem,
  addLog,
}: {
  onNavigate: (tab: Tab) => void;
  selectedItem: RecyclingItem | null;
  setSelectedItem: (item: RecyclingItem | null) => void;
  addLog: (item: { itemId: string; itemName: string; category: MaterialCategory; quantity: number }) => void;
}) {
  const [query, setQuery] = useState('');
  const [listening, setListening] = useState(false);
  const speech = useSpeech();

  useEffect(() => {
    if (speech.transcript) {
      setQuery(speech.transcript);
      setSelectedItem(classifyMaterial(speech.transcript));
    }
  }, [speech.transcript, setSelectedItem]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return RECYCLING_ITEMS.filter((item) => [item.name, ...item.keywords].some((value) => value.toLowerCase().includes(q))).slice(0, 5);
  }, [query]);

  const speakSteps = () => {
    if (!selectedItem) return;
    speech.speak(`${selectedItem.name}. Paso 1: ${selectedItem.steps[0]} Paso 2: ${selectedItem.steps[1]} Paso 3: ${selectedItem.steps[2]}`);
  };

  return (
    <div className="animate-fade-in space-y-8">
      <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-forest-900 via-forest-800 to-mint-700 px-6 py-10 text-white shadow-lg sm:px-10 sm:py-14">
        <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full border-[28px] border-white/10" />
        <div className="absolute -bottom-24 right-24 h-48 w-48 rounded-full border-[18px] border-white/10" />
        <div className="relative max-w-2xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-bold uppercase tracking-wider">
            <Sparkles size={14} /> Tu guía para reciclar mejor
          </div>
          <h1 className="max-w-xl text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            Cada residuo tiene un camino. <span className="text-forest-200">Encuentra el correcto.</span>
          </h1>
          <p className="mt-4 max-w-lg text-base leading-relaxed text-forest-100 sm:text-lg">
            Aprende a separar tus residuos, encuentra puntos limpios y convierte pequeñas acciones en un gran impacto.
          </p>
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-forest-600 dark:text-forest-400">Asistente de residuos</p>
            <h2 className="mt-1 text-2xl font-extrabold tracking-tight">¿Qué quieres reciclar hoy?</h2>
          </div>
          <span className="hidden rounded-full bg-[var(--eco-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--eco-text-muted)] sm:block">
            Te ayudamos paso a paso
          </span>
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-4 text-[var(--eco-text-muted)]" size={21} />
          <input
            className="eco-input pl-12 pr-14"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Ej.: botella de vidrio, caja de leche..."
            aria-label="Buscar residuo"
          />
          {query && (
            <button onClick={() => setQuery('')} className="absolute right-2 top-1.5 rounded-lg p-2 text-[var(--eco-text-muted)]" aria-label="Limpiar búsqueda">
              <X size={20} />
            </button>
          )}

          {results.length > 0 && (
            <div className="absolute left-0 right-0 top-[56px] z-20 overflow-hidden rounded-xl border border-[var(--eco-border)] bg-[var(--eco-card)] shadow-xl">
              {results.map((result) => (
                <button
                  key={result.id}
                  onClick={() => {
                    setSelectedItem(result);
                    setQuery(result.name);
                  }}
                  className="flex w-full items-center gap-3 border-b border-[var(--eco-border)] p-3 text-left hover:bg-[var(--eco-surface)]"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ backgroundColor: `${MATERIAL_COLORS[result.category]}20`, color: MATERIAL_COLORS[result.category] }}>
                    <Icon name={result.icon} size={19} />
                  </span>
                  <span>
                    <span className="block font-semibold">{result.name}</span>
                    <span className="text-xs text-[var(--eco-text-muted)]">{MATERIAL_LABELS[result.category]}</span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {query.trim() && results.length === 0 && (
          <button className="eco-btn-outline mt-3" onClick={() => setSelectedItem(classifyMaterial(query))}>
            Clasificar consulta
          </button>
        )}

        <div className="mt-4 flex flex-col items-center gap-3 sm:flex-row">
          <button
            className={`relative flex h-16 w-full items-center justify-center gap-3 rounded-2xl font-bold text-white shadow-md transition sm:w-auto sm:px-7 ${listening ? 'bg-red-600' : 'bg-forest-700 hover:bg-forest-800'}`}
            onClick={() => {
              if (listening) {
                speech.stopListening();
                setListening(false);
              } else {
                speech.startListening();
                setListening(true);
              }
            }}
          >
            <span className={listening ? 'absolute inset-0 animate-pulse rounded-2xl bg-red-500/40' : ''} />
            <Mic size={24} className="relative" />
            <span className="relative">{listening ? 'Escuchando...' : 'Hablar'}</span>
          </button>
          <span className="text-sm text-[var(--eco-text-muted)]">{listening ? 'Di el nombre de tu residuo' : 'Toca para dictar tu residuo'}</span>
        </div>
      </section>

      {selectedItem ? (
        <ResultCard
          item={selectedItem}
          onSpeak={speakSteps}
          speech={speech}
          onLog={() => addLog({ itemId: selectedItem.id, itemName: selectedItem.name, category: selectedItem.category, quantity: 1 })}
        />
      ) : (
        <section className="grid gap-4 sm:grid-cols-3">
          <QuickCard icon="file-text" title="Aprende" text="Guía simple por material" onClick={() => onNavigate('guide')} />
          <QuickCard icon="map" title="Encuentra" text="Puntos limpios cercanos" onClick={() => onNavigate('map')} />
          <QuickCard icon="camera" title="Escanea" text="Detecta con la cámara" onClick={() => onNavigate('scanner')} />
        </section>
      )}

      <section className="eco-card flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-mint-100 text-mint-700 dark:bg-mint-900 dark:text-mint-300">
            <MapPinned size={24} />
          </div>
          <div>
            <h3 className="font-bold">¿Listo para entregar tus reciclables?</h3>
            <p className="text-sm text-[var(--eco-text-muted)]">Encuentra el punto limpio más cercano a ti.</p>
          </div>
        </div>
        <button className="eco-btn-outline w-full sm:w-auto" onClick={() => onNavigate('map')}>
          Ver puntos limpios <MapPin size={17} />
        </button>
      </section>
    </div>
  );
}

function QuickCard({ icon, title, text, onClick }: { icon: string; title: string; text: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="eco-card group flex items-center gap-4 p-5 text-left transition hover:-translate-y-1 hover:shadow-lg">
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-forest-100 text-forest-700 transition group-hover:bg-forest-700 group-hover:text-white dark:bg-forest-900 dark:text-forest-300">
        <Icon name={icon} />
      </span>
      <span>
        <span className="block font-bold">{title}</span>
        <span className="text-sm text-[var(--eco-text-muted)]">{text}</span>
      </span>
    </button>
  );
}

function ResultCard({ item, onSpeak, speech, onLog }: { item: RecyclingItem; onSpeak: () => void; speech: ReturnType<typeof useSpeech>; onLog: () => void }) {
  return (
    <section className="eco-card animate-slide-up overflow-hidden">
      <div className="flex flex-col gap-4 border-b border-[var(--eco-border)] bg-[var(--eco-surface)] p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-forest-700 shadow-sm dark:bg-forest-900 dark:text-forest-300">
            <Icon name={item.icon} size={28} />
          </span>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-forest-600 dark:text-forest-300">{MATERIAL_LABELS[item.category]}</p>
            <p className="text-xs font-semibold" style={{ color: MATERIAL_COLORS[item.category] }}>{MATERIAL_CONTAINERS[item.category]}</p>
            <h2 className="text-xl font-extrabold">{item.name}</h2>
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={onSpeak} className="eco-btn-outline flex-1 sm:flex-none">
            {speech.isSpeaking ? <Pause size={17} /> : <Volume2 size={17} />}
            {speech.isSpeaking ? 'Pausar' : 'Escuchar'}
          </button>
          {speech.isSpeaking && (
            <button onClick={speech.stop} className="rounded-xl border-2 border-[var(--eco-border)] px-4 text-sm font-semibold" aria-label="Detener lectura">
              <X size={17} />
            </button>
          )}
        </div>
      </div>

      <div className="p-5 sm:p-7">
        <h3 className="mb-5 flex items-center gap-2 font-bold">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-forest-700 text-sm text-white">✓</span>
          Prepáralo en 3 pasos
        </h3>

        <div className="grid gap-4 md:grid-cols-3">
          {item.steps.map((step, index) => (
            <div key={step} className="flex gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-forest-100 text-sm font-extrabold text-forest-800 dark:bg-forest-900 dark:text-forest-200">
                {index + 1}
              </span>
              <p className="text-sm leading-relaxed text-[var(--eco-text-muted)]">{step}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-col gap-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-900 dark:bg-amber-950/40 dark:text-amber-100 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="font-bold">Tip Eco:</span> {item.tip}
          </div>
          <button onClick={onLog} className="eco-btn whitespace-nowrap">
            <Check size={16} /> Guardar acción
          </button>
        </div>
      </div>
    </section>
  );
}

function MapPage() {
  const [filter, setFilter] = useState<'all' | MaterialCategory>('all');
  const [points, setPoints] = useState<CleanPoint[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const { location, status, error, requestLocation } = useGeolocation();

  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  useEffect(() => {
    if (!location) {
      setPoints([]);
      setSearching(false);
      return;
    }

    const controller = new AbortController();
    setSearching(true);
    setSearchError('');

    const radiusMeters = 30000;
    const query = `[out:json][timeout:25];(
      node(around:${radiusMeters},${location.lat},${location.lng})["amenity"="recycling"];
      way(around:${radiusMeters},${location.lat},${location.lng})["amenity"="recycling"];
    );out center;`;

    fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error('network');
        return response.json();
      })
      .then((data) => {
        const nextPoints = (data.elements ?? [])
          .map((element: { id: number; lat?: number; lon?: number; center?: { lat: number; lon: number }; tags?: Record<string, string> }, index: number) => {
            const tags = element.tags ?? {};
            const center = element.center ?? { lat: element.lat ?? NaN, lon: element.lon ?? NaN };
            const name = tags.name || tags.operator || 'Punto de reciclaje';
            const materialTag = tags.recycling_type || tags.recycling || 'Reciclaje general';
            const detected = classifyMaterial(`${materialTag} ${name}`);
            return {
              id: element.id || index,
              name,
              address: tags['addr:street'] ? `${tags['addr:street']} ${tags['addr:housenumber'] ?? ''}`.trim() : 'Ubicación detectada en mapa',
              lat: center.lat,
              lng: center.lon,
              materials: [detected.category],
              distance: haversineDistance(location, { lat: center.lat, lng: center.lon }),
              hours: tags.opening_hours || 'Horario no disponible',
            } satisfies CleanPoint;
          })
          .filter((point) => Number.isFinite(point.lat) && Number.isFinite(point.lng))
          .sort((a, b) => a.distance - b.distance);

        setPoints(nextPoints);
      })
      .catch((requestError: unknown) => {
        if ((requestError as Error).name !== 'AbortError') {
          setPoints([]);
          setSearchError('No se pudieron consultar los puntos cercanos en tu ubicación.');
        }
      })
      .finally(() => setSearching(false));

    return () => controller.abort();
  }, [location]);

  const pointsWithDistance = useMemo(() => {
    return points
      .map((point) => ({
        ...point,
        realDistance: location ? haversineDistance(location, { lat: point.lat, lng: point.lng }) : point.distance,
      }))
      .sort((a, b) => a.realDistance - b.realDistance);
  }, [location, points]);

  const filtered = filter === 'all' ? pointsWithDistance : pointsWithDistance.filter((point) => point.materials.includes(filter));

  return (
    <div className="animate-fade-in space-y-7">
      <PageIntro eyebrow="Encuentra y participa" title="Puntos limpios cercanos" text="Lleva tus materiales al lugar correcto. Filtra por tipo de residuo y encuentra el punto que mejor te convenga." icon={<MapPinned size={26} />} />

      <div className="flex flex-wrap items-center gap-3">
        <button onClick={requestLocation} disabled={status === 'loading'} className="eco-btn">
          {status === 'loading' ? <span className="animate-spin"><Navigation size={18} /></span> : <Navigation size={18} />}
          Usar mi ubicación actual
        </button>
        {status === 'error' && <span className="text-sm text-red-600 dark:text-red-400">{error}</span>}
        {status === 'success' && <span className="text-sm font-semibold text-forest-600 dark:text-forest-400">Ubicación detectada — distancias calculadas</span>}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {(['all', 'vidrio', 'papel', 'plastico', 'pilas', 'raee', 'metal', 'textil', 'peligroso'] as const).map((item) => (
          <button key={item} onClick={() => setFilter(item)} className={`eco-chip ${filter === item ? 'active' : ''}`}>
            {item === 'all' ? 'Todos' : MATERIAL_LABELS[item]}
          </button>
        ))}
      </div>

      {searching && <p className="text-sm text-[var(--eco-text-muted)]">Buscando puntos registrados cerca de ti...</p>}
      {status === 'error' && error && <p className="text-sm text-red-600">{error}</p>}
      {searchError && <p className="text-sm text-red-600">{searchError}</p>}
      {!searching && location && filtered.length === 0 && <p className="eco-card p-5 text-sm text-[var(--eco-text-muted)]">No encontramos puntos de reciclaje registrados en esta zona.</p>}
      {!location && status !== 'loading' && !searchError && (
        <p className="eco-card p-5 text-sm text-[var(--eco-text-muted)]">Activa tu ubicación para ver los puntos limpios más cercanos a ti.</p>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
        <MapView points={filtered} userLocation={location} onUseLocation={requestLocation} isLoadingLocation={status === 'loading'} locationError={status === 'error' ? error : null} />

        <div className="space-y-3">
          {filtered.map((point, index) => (
            <div key={point.id} className="eco-card p-4 transition hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-forest-700 text-sm font-bold text-white">{index + 1}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold">{point.name}</h3>
                    <span className="shrink-0 rounded-full bg-forest-100 px-2 py-1 text-xs font-bold text-forest-800 dark:bg-forest-900 dark:text-forest-200">
                      {formatDistance(point.realDistance)}
                    </span>
                  </div>
                  <p className="mt-1 flex items-start gap-1 text-sm text-[var(--eco-text-muted)]">
                    <MapPin size={15} className="mt-0.5 shrink-0" />
                    {point.address}
                  </p>
                  <p className="mt-2 text-xs text-[var(--eco-text-muted)]">{point.hours}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {point.materials.map((material) => (
                      <span key={material} className="rounded-md px-2 py-1 text-[10px] font-semibold" style={{ backgroundColor: `${MATERIAL_COLORS[material]}18`, color: MATERIAL_COLORS[material] }}>
                        {MATERIAL_LABELS[material]}
                      </span>
                    ))}
                  </div>
                  <a className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-forest-700" target="_blank" rel="noreferrer" href={`https://www.google.com/maps/dir/?api=1&destination=${point.lat},${point.lng}`}>
                    Cómo llegar <Navigation size={14} />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function GuidePage() {
  const [open, setOpen] = useState<MaterialCategory | null>('papel');

  return (
    <div className="animate-fade-in space-y-7">
      <PageIntro eyebrow="Aprende a separar" title="Guía de clasificación" text="Conocer el material es el primer paso. Descubre cómo separarlo, limpiarlo y prepararlo." icon={<BookOpen size={26} />} />

      <div className="grid gap-4 md:grid-cols-2">
        {MATERIAL_GUIDES.map((guide) => (
          <div key={guide.category} className="eco-card overflow-hidden">
            <button onClick={() => setOpen(open === guide.category ? null : guide.category)} className="flex w-full items-center gap-4 p-5 text-left">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white" style={{ backgroundColor: guide.color }}>
                <Icon name={guide.icon} size={24} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-lg font-extrabold">{guide.title}</span>
                <span className="block text-sm text-[var(--eco-text-muted)]">{guide.description}</span>
              </span>
              <ChevronDown className={`transition ${open === guide.category ? 'rotate-180' : ''}`} />
            </button>

            {open === guide.category && (
              <div className="animate-slide-up border-t border-[var(--eco-border)] p-5">
                <div className="grid gap-4 sm:grid-cols-3">
                  {[
                    ['Separa', guide.instructions.separation],
                    ['Limpia', guide.instructions.limpieza],
                    ['Prepara', guide.instructions.compactacion],
                  ].map(([label, text], index) => (
                    <div key={String(label)} className="rounded-xl bg-[var(--eco-surface)] p-4">
                      <div className="mb-2 flex items-center gap-2 font-bold">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-forest-700 text-xs text-white">{index + 1}</span>
                        {label}
                      </div>
                      <p className="text-sm leading-relaxed text-[var(--eco-text-muted)]">{text}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="mb-2 text-xs font-bold uppercase tracking-wider text-forest-700 dark:text-forest-300">Sí se acepta</p>
                    <div className="flex flex-wrap gap-2">
                      {guide.examples.map((example) => (
                        <span key={example} className="rounded-lg bg-forest-50 px-2.5 py-1.5 text-xs font-medium text-forest-800 dark:bg-forest-950 dark:text-forest-200">
                          <Check size={12} className="mr-1 inline" />
                          {example}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="mb-2 text-xs font-bold uppercase tracking-wider text-red-700">No se acepta</p>
                    <div className="flex flex-wrap gap-2">
                      {guide.notRecyclable.map((example) => (
                        <span key={example} className="rounded-lg bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-800 dark:bg-red-950 dark:text-red-200">
                          <X size={12} className="mr-1 inline" />
                          {example}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <SpeakButton text={`${guide.title}. ${guide.instructions.separation} ${guide.instructions.limpieza} ${guide.instructions.compactacion}`} label="Escuchar guía" />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function AchievementsPage({ logs, stats, onLog }: { logs: ReturnType<typeof useRecyclingLog>['logs']; stats: ReturnType<typeof useRecyclingLog>['stats']; onLog: ReturnType<typeof useRecyclingLog>['addLog'] }) {
  const [showLog, setShowLog] = useState(false);

  return (
    <div className="animate-fade-in space-y-7">
      <PageIntro eyebrow="Tu impacto cuenta" title="Logros e impacto" text="Cada vez que reciclas, avanzas. Registra tus acciones y mira cómo cambia tu impacto." icon={<Trophy size={26} />} />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Puntos acumulados" value={stats.points} icon={<Zap />} />
        <StatCard label="Residuos reciclados" value={stats.total} icon={<Recycle />} />
        <StatCard label="Materiales distintos" value={stats.categoryCount} icon={<Sparkles />} />
      </div>

      <section className="eco-card overflow-hidden">
        <div className="flex items-center justify-between border-b border-[var(--eco-border)] p-5">
          <div>
            <h2 className="text-lg font-extrabold">Tus logros</h2>
            <p className="text-sm text-[var(--eco-text-muted)]">Desbloquea insignias con tus hábitos</p>
          </div>
          <button onClick={() => setShowLog((value) => !value)} className="eco-btn">
            <Plus size={17} /> Registrar
          </button>
        </div>

        <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-3">
          {ACHIEVEMENTS.map((achievement) => {
            const unlocked =
              achievement.id === 'first-recycle'
                ? stats.total >= 1
                : achievement.id === 'variety-collector'
                  ? stats.categoryCount >= 5
                  : achievement.id === 'planet-guardian'
                    ? stats.points >= 500
                    : stats.total >= achievement.threshold;

            return (
              <div key={achievement.id} className={`rounded-2xl border p-4 ${unlocked ? 'border-forest-300 bg-forest-50 dark:border-forest-700 dark:bg-forest-950' : 'border-[var(--eco-border)] opacity-60'}`}>
                <div className="flex items-center gap-3">
                  <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${unlocked ? 'bg-forest-700 text-white' : 'bg-[var(--eco-surface)] text-[var(--eco-text-muted)]'}`}>
                    <Icon name={achievement.icon} />
                  </span>
                  <div>
                    <h3 className="font-bold">{achievement.title}</h3>
                    <p className="text-xs text-[var(--eco-text-muted)]">{achievement.description}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {showLog && <LogForm onClose={() => setShowLog(false)} onLog={onLog} />}

      <ImpactSection />

      <div className="eco-card p-5">
        <h3 className="mb-3 font-bold">Registro reciente</h3>
        {logs.length === 0 ? (
          <p className="text-sm text-[var(--eco-text-muted)]">Todavía no registras residuos reciclados.</p>
        ) : (
          <div className="space-y-2">
            {logs.slice(0, 5).map((log) => (
              <div key={log.id} className="flex items-center justify-between rounded-xl bg-[var(--eco-surface)] px-3 py-2 text-sm">
                <span>{log.itemName}</span>
                <span className="font-semibold text-forest-700">{log.quantity}x</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: ReactNode }) {
  return (
    <div className="eco-card flex items-center gap-4 p-5">
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-forest-100 text-forest-700 dark:bg-forest-900 dark:text-forest-300">{icon}</span>
      <div>
        <p className="text-2xl font-extrabold">{value}</p>
        <p className="text-xs font-semibold text-[var(--eco-text-muted)]">{label}</p>
      </div>
    </div>
  );
}

function LogForm({ onClose, onLog }: { onClose: () => void; onLog: ReturnType<typeof useRecyclingLog>['addLog'] }) {
  const [item, setItem] = useState(RECYCLING_ITEMS[0]);
  const [quantity, setQuantity] = useState(1);

  return (
    <section className="eco-card animate-scale-in p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-extrabold">Registrar reciclaje</h2>
        <button onClick={onClose} aria-label="Cerrar"><X /></button>
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_120px_auto]">
        <select className="eco-input" value={item.id} onChange={(event) => setItem(RECYCLING_ITEMS.find((entry) => entry.id === event.target.value) ?? RECYCLING_ITEMS[0])}>
          {RECYCLING_ITEMS.map((entry) => (
            <option key={entry.id} value={entry.id}>{entry.name}</option>
          ))}
        </select>
        <input className="eco-input" type="number" min={1} max={100} value={quantity} onChange={(event) => setQuantity(Math.max(1, Number(event.target.value)))} aria-label="Cantidad" />
        <button className="eco-btn" onClick={() => { onLog({ itemId: item.id, itemName: item.name, category: item.category, quantity }); onClose(); }}>
          <Check size={17} /> Guardar
        </button>
      </div>
    </section>
  );
}

function ImpactSection() {
  return (
    <section>
      <div className="mb-4">
        <p className="text-sm font-semibold uppercase tracking-wider text-forest-600 dark:text-forest-400">El cambio que construimos</p>
        <h2 className="mt-1 text-2xl font-extrabold">De la duda a la acción</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 dark:border-red-900 dark:bg-red-950/30">
          <h3 className="mb-4 flex items-center gap-2 font-extrabold text-red-900 dark:text-red-100">
            <CircleHelp size={20} />
            {IMPACT_STATS.current.title}
          </h3>
          {IMPACT_STATS.current.problems.map((problem) => (
            <p key={problem.text} className="mb-3 flex gap-3 text-sm text-red-900/80 dark:text-red-100/80">
              <Icon name={problem.icon} size={18} />
              {problem.text}
            </p>
          ))}
        </div>

        <div className="rounded-2xl border border-forest-200 bg-forest-50 p-5 dark:border-forest-800 dark:bg-forest-950/30">
          <h3 className="mb-4 flex items-center gap-2 font-extrabold text-forest-900 dark:text-forest-100">
            <CheckCircle2 size={20} />
            {IMPACT_STATS.projected.title}
          </h3>
          {IMPACT_STATS.projected.benefits.map((benefit) => (
            <p key={benefit.text} className="mb-3 flex gap-3 text-sm text-forest-900/80 dark:text-forest-100/80">
              <Icon name={benefit.icon} size={18} />
              {benefit.text}
            </p>
          ))}
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        {COMPLEMENTARY_TECH.map((item) => (
          <div className="eco-card p-5" key={item.title}>
            <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-mint-100 text-mint-700 dark:bg-mint-900 dark:text-mint-300">
              <Icon name={item.icon} />
            </span>
            <h3 className="font-bold">{item.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-[var(--eco-text-muted)]">{item.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function ScannerPage({ onResult }: { onResult: (item: RecyclingItem) => void }) {
  return (
    <div className="animate-fade-in space-y-7">
      <PageIntro eyebrow="Detecta y recicla" title="Escáner de residuos" text="Apunta con la cámara de tu dispositivo al residuo y te diremos qué material es y cómo prepararlo." icon={<Camera size={26} />} />
      <CameraScanner onResult={onResult} />
      <div className="eco-card p-5">
        <h3 className="mb-2 font-bold">¿Cómo funciona?</h3>
        <p className="text-sm leading-relaxed text-[var(--eco-text-muted)]">
          El escáner abre la cámara o tu galería y analiza la imagen con MobileNet. La etiqueta reconocida se traduce a una categoría de reciclaje y activa la guía de preparación en pantalla y por voz.
        </p>
      </div>
    </div>
  );
}

const THEME_LABELS: Record<ThemeMode, string> = { light: 'Claro', dark: 'Oscuro', auto: 'Automático' };

function AccessibilityPage() {
  const settings = useAccessibility();

  return (
    <div className="animate-fade-in space-y-7">
      <PageIntro eyebrow="Diseñada para ti" title="Accesibilidad y personalización" text="Ajusta EcoLingo para que sea cómodo, claro y fácil de usar." icon={<Accessibility size={26} />} />

      <div className="grid gap-5 lg:grid-cols-2">
        <SettingCard title="Tema de pantalla" description="Elige cómo quieres ver la aplicación">
          <div className="grid grid-cols-3 gap-2">
            {(['light', 'dark', 'auto'] as ThemeMode[]).map((theme) => (
              <ChoiceButton key={theme} active={settings.theme === theme} onClick={() => settings.setTheme(theme)} label={THEME_LABELS[theme]} />
            ))}
          </div>
        </SettingCard>

        <SettingCard title="Contraste" description="Aumenta el contraste de textos y bordes">
          <Toggle checked={settings.highContrast} onChange={settings.setHighContrast} label="Modo alto contraste" />
        </SettingCard>

        <SettingCard title="Tamaño del texto" description="Haz que el contenido sea más fácil de leer">
          <div className="flex items-center gap-2">
            {[[0.9, 'A−'], [1, 'A'], [1.15, 'A+']].map(([scale, label]) => (
              <button key={String(scale)} onClick={() => settings.setFontScale(scale as number)} className={`flex-1 rounded-xl border-2 p-3 font-bold ${settings.fontScale === scale ? 'border-forest-700 bg-forest-50 text-forest-800 dark:bg-forest-950 dark:text-forest-200' : 'border-[var(--eco-border)]'}`} style={{ fontSize: `${Number(scale)}rem` }}>
                {label}
              </button>
            ))}
          </div>
        </SettingCard>

        <SettingCard title="Lectura por voz" description="Escucha las instrucciones en voz alta">
          <Toggle checked={settings.autoSpeak} onChange={settings.setAutoSpeak} label="Activar lectura automática" />
          <div className="mt-4">
            <label className="mb-2 block text-sm font-semibold">Velocidad: {settings.speechRate.toFixed(1)}x</label>
            <input className="w-full accent-forest-700" type="range" min="0.5" max="2.0" step="0.1" value={settings.speechRate} onChange={(event) => settings.setSpeechRate(Number(event.target.value))} />
            <div className="mt-1 flex justify-between text-xs text-[var(--eco-text-muted)]"><span>0.5x</span><span>2.0x</span></div>
          </div>
          <div className="mt-4 flex gap-2">
            <button onClick={() => settings.speak('Hola, esta es una prueba de la velocidad de lectura de EcoLingo.')} className="eco-btn-outline flex-1">
              <Volume2 size={17} /> Probar voz
            </button>
            {settings.isSpeaking && <button onClick={settings.stopSpeaking} className="eco-btn-outline"><Square size={17} /></button>}
          </div>
        </SettingCard>

        <SettingCard title="Apoyo para daltonismo" description="Usa una paleta adaptada para distinguir mejor los colores">
          <div className="grid grid-cols-2 gap-2">
            {([
              ['normal', 'Normal'],
              ['protanopia', 'Protanopia'],
              ['deuteranopia', 'Deuteranopia'],
              ['tritanopia', 'Tritanopia'],
            ] as [ColorBlindnessMode, string][]).map(([mode, label]) => (
              <ChoiceButton key={mode} active={settings.colorBlindness === mode} onClick={() => settings.setColorBlindness(mode)} label={label} />
            ))}
          </div>
        </SettingCard>

        <SettingCard title="Sobre EcoLingo" description="Gestión y Educación para el Reciclaje Domiciliario">
          <div className="flex items-center gap-3 text-sm text-[var(--eco-text-muted)]">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-forest-100 text-forest-700 dark:bg-forest-900 dark:text-forest-300">
              <Recycle />
            </span>
            <p>Una herramienta educativa para hacer del reciclaje un hábito simple, accesible y cotidiano.</p>
          </div>
        </SettingCard>
      </div>
    </div>
  );
}

function SettingCard({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <section className="eco-card p-5">
      <h2 className="font-extrabold">{title}</h2>
      <p className="mt-1 mb-5 text-sm text-[var(--eco-text-muted)]">{description}</p>
      {children}
    </section>
  );
}

function ChoiceButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button onClick={onClick} className={`rounded-xl border-2 p-3 text-sm font-semibold transition ${active ? 'border-forest-700 bg-forest-50 text-forest-800 dark:bg-forest-950 dark:text-forest-200' : 'border-[var(--eco-border)] hover:bg-[var(--eco-surface)]'}`}>
      {active && <Check size={15} className="mr-1 inline" />}
      {label}
    </button>
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (value: boolean) => void; label: string }) {
  return (
    <button className="flex w-full items-center justify-between text-left" onClick={() => onChange(!checked)}>
      <span className="font-semibold">{label}</span>
      <span className={`toggle-switch relative h-7 w-12 rounded-full transition ${checked ? 'bg-forest-700' : 'bg-gray-300 dark:bg-gray-600'}`}>
        <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${checked ? 'left-6' : 'left-1'}`} />
      </span>
    </button>
  );
}

function PageIntro({ eyebrow, title, text, icon }: { eyebrow: string; title: string; text: string; icon: ReactNode }) {
  return (
    <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-forest-600 dark:text-forest-400">
          {icon}
          {eyebrow}
        </p>
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{title}</h1>
        <p className="mt-2 max-w-2xl leading-relaxed text-[var(--eco-text-muted)]">{text}</p>
      </div>
    </section>
  );
}

function BottomNav({ tab, onNavigate }: { tab: Tab; onNavigate: (tab: Tab) => void }) {
  const items: [Tab, string, string][] = [
    ['home', 'leaf', 'Inicio'],
    ['map', 'map', 'Mapa'],
    ['guide', 'file-text', 'Guía'],
    ['achievements', 'trophy', 'Logros'],
    ['scanner', 'camera', 'Escáner'],
    ['accessibility', 'accessibility', 'Ajustes'],
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--eco-border)] bg-[var(--eco-bg)]/95 backdrop-blur-md lg:hidden">
      <div className="mx-auto grid max-w-lg grid-cols-6 px-1 pb-safe">
        {items.map(([key, icon, label]) => (
          <button
            key={key}
            onClick={() => onNavigate(key)}
            className={`flex flex-col items-center gap-1 rounded-xl py-2 text-[10px] font-semibold transition ${tab === key ? 'bg-forest-100 text-forest-800 dark:bg-forest-900 dark:text-forest-200' : 'text-[var(--eco-text-muted)] hover:bg-[var(--eco-surface)]'}`}
          >
            <Icon name={icon} size={20} />
            {label}
          </button>
        ))}
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <AccessibilityProvider>
      <AppShell />
    </AccessibilityProvider>
  );
}
