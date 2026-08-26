import type { Achievement, CleanPoint } from '@/types';

export const CLEAN_POINTS: CleanPoint[] = [
  {
    id: 1,
    name: 'Punto Limpio Central',
    address: 'Av. Principal 123, Centro',
    lat: -33.4489,
    lng: -70.6693,
    materials: ['vidrio', 'papel', 'plastico', 'metal', 'pilas', 'raee'],
    distance: 350,
    hours: 'Lun-Dom: 08:00-20:00',
  },
  {
    id: 2,
    name: 'Estación de Reciclaje Norte',
    address: 'Calle Los Pinos 456, Barrio Norte',
    lat: -33.4304,
    lng: -70.6529,
    materials: ['vidrio', 'papel', 'plastico', 'metal'],
    distance: 820,
    hours: 'Lun-Sáb: 09:00-18:00',
  },
  {
    id: 3,
    name: 'Centro de Acopio Sur',
    address: 'Av. Sur 789, Zona Industrial',
    lat: -33.4612,
    lng: -70.6776,
    materials: ['vidrio', 'papel', 'plastico', 'metal', 'raee', 'pilas'],
    distance: 1200,
    hours: 'Lun-Vie: 08:00-17:00',
  },
  {
    id: 4,
    name: 'Punto Verde Plaza de Armas',
    address: 'Plaza de Armas s/n',
    lat: -33.4378,
    lng: -70.6505,
    materials: ['vidrio', 'papel', 'plastico', 'metal', 'organico'],
    distance: 550,
    hours: 'Lun-Dom: 07:00-22:00',
  },
  {
    id: 5,
    name: 'EcoPunto Estación Metro',
    address: 'Av. Libertador 1010',
    lat: -33.4421,
    lng: -70.6831,
    materials: ['papel', 'plastico', 'metal', 'pilas'],
    distance: 680,
    hours: 'Lun-Dom: 06:00-23:00',
  },
  {
    id: 6,
    name: 'Reciclaje Comunitario Villa Verde',
    address: 'Pasaje Las Flores 22, Villa Verde',
    lat: -33.4543,
    lng: -70.6608,
    materials: ['vidrio', 'papel', 'plastico', 'organico'],
    distance: 950,
    hours: 'Mar-Dom: 10:00-19:00',
  },
];

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first-recycle',
    title: 'Primer Paso',
    description: 'Recicla por primera vez',
    icon: 'sprout',
    points: 10,
    threshold: 1,
  },
  {
    id: 'eco-warrior',
    title: 'Guerrero Eco',
    description: 'Recicla 10 residuos',
    icon: 'shield',
    points: 50,
    threshold: 10,
  },
  {
    id: 'recycling-master',
    title: 'Maestro del Reciclaje',
    description: 'Recicla 50 residuos',
    icon: 'crown',
    points: 200,
    threshold: 50,
  },
  {
    id: 'variety-collector',
    title: 'Coleccionista',
    description: 'Recicla 5 tipos de materiales distintos',
    icon: 'palette',
    points: 100,
    threshold: 5,
  },
  {
    id: 'glass-hero',
    title: 'Héroe del Vidrio',
    description: 'Recicla 10 botellas de vidrio',
    icon: 'wine',
    points: 80,
    threshold: 10,
  },
  {
    id: 'plastic-saver',
    title: 'Salvador de Océanos',
    description: 'Recicla 20 plásticos',
    icon: 'waves',
    points: 120,
    threshold: 20,
  },
  {
    id: 'planet-guardian',
    title: 'Guardián del Planeta',
    description: 'Acumula 500 puntos',
    icon: 'globe',
    points: 0,
    threshold: 500,
  },
];

export const IMPACT_STATS = {
  current: {
    title: 'Situación Actual',
    problems: [
      { icon: 'help-circle', text: 'Dudas frecuentes en la separación de residuos' },
      { icon: 'accessibility', text: 'Baja accesibilidad para personas mayores o con discapacidad' },
      { icon: 'meh', text: 'Falta de incentivos para mantener el hábito de reciclar' },
      { icon: 'map-off', text: 'Desconocimiento de los puntos limpios cercanos' },
    ],
  },
  projected: {
    title: 'Escenario con EcoLingo',
    benefits: [
      { icon: 'check-circle', text: 'Autonomía total: cada usuario sabe qué y cómo reciclar' },
      { icon: 'mic', text: 'Guía práctica con dictado por voz para todas las edades' },
      { icon: 'trophy', text: 'Hábitos sostenibles reforzados con gamificación' },
      { icon: 'map', text: 'Geolocalización de puntos limpios en tiempo real' },
    ],
  },
};

export const COMPLEMENTARY_TECH = [
  {
    title: 'Red de Promotores Ambientales',
    description: 'Estudiantes y docentes capacitados que replican conocimientos de reciclaje en sus comunidades y barrios.',
    icon: 'users',
  },
  {
    title: 'Talleres Comunitarios',
    description: 'Sesiones educativas en colegios, bibliotecas y centros comunitarios para enseñar reciclaje de forma práctica.',
    icon: 'presentation',
  },
  {
    title: 'Alianzas con Municipios',
    description: 'Convenios con gobiernos locales para mantener datos actualizados de puntos limpios y rutas de recolección.',
    icon: 'building-2',
  },
];
