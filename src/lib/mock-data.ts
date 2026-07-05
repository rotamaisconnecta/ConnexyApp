export const currentUser = {
  name: "Lucas Almeida",
  handle: "lucas.a",
  photo: "https://i.pravatar.cc/200?img=12",
  rating: 4.9,
  trips: 23,
  connections: 48,
  interests: ["Viagens", "Socializar", "Eventos", "Música", "Tecnologia"],
};

export type Person = {
  id: string;
  name: string;
  age: number;
  distanceMeters: number;
  online: boolean;
  lastSeen?: string;
  photo: string;
  interests: string[];
  bio?: string;
};

export const people: Person[] = [
  { id: "beatriz", name: "Beatriz", age: 26, distanceMeters: 15,   online: true,  photo: "https://i.pravatar.cc/200?img=47", interests: ["Música", "Viagens"], bio: "Amante de vinis e cafés escondidos." },
  { id: "rafael",  name: "Rafael",  age: 30, distanceMeters: 80,   online: true,  photo: "https://i.pravatar.cc/200?img=13", interests: ["Esportes", "Tecnologia"], bio: "Dev, corredor, sempre buscando um novo trail." },
  { id: "juliana", name: "Juliana", age: 27, distanceMeters: 350,  online: true,  photo: "https://i.pravatar.cc/200?img=45", interests: ["Café", "Eventos"], bio: "Curadora cultural, adora um pocket show." },
  { id: "carlos",  name: "Carlos",  age: 29, distanceMeters: 1400, online: false, lastSeen: "há 12 min", photo: "https://i.pravatar.cc/200?img=15", interests: ["Viagens", "Negócios"], bio: "Empreendedor de bairro." },
  { id: "marina",  name: "Marina",  age: 24, distanceMeters: 3200, online: true,  photo: "https://i.pravatar.cc/200?img=48", interests: ["Arte", "Moda"], bio: "Ilustradora freelancer." },
  { id: "diego",   name: "Diego",   age: 32, distanceMeters: 9800, online: false, lastSeen: "há 1 h",   photo: "https://i.pravatar.cc/200?img=52", interests: ["Games", "Tecnologia"], bio: "Streamer nas horas vagas." },
];

export type Driver = {
  id: string;
  name: string;
  rating: number;
  eta: string;
  distanceMeters: number;
  price: string;
  car: string;
  plate: string;
  photo: string;
};

export const drivers: Driver[] = [
  { id: "d1", name: "Carlos",  rating: 4.9, eta: "3 min", distanceMeters: 800,  price: "R$ 18,50", car: "Chevrolet Onix Prata", plate: "ABC1D23", photo: "https://i.pravatar.cc/200?img=68" },
  { id: "d2", name: "Mariana", rating: 4.9, eta: "3 min", distanceMeters: 800,  price: "R$ 19,90", car: "Hyundai HB20 Branco",   plate: "DEF2E34", photo: "https://i.pravatar.cc/200?img=44" },
  { id: "d3", name: "Rafael",  rating: 4.7, eta: "4 min", distanceMeters: 1200, price: "R$ 20,10", car: "Volkswagen Polo Preto", plate: "GHI3F45", photo: "https://i.pravatar.cc/200?img=33" },
];

export type Place = {
  id: string;
  name: string;
  category: "Restaurantes" | "Cafés" | "Eventos" | "Lojas";
  distanceMeters: number;
  rating: number;
  reviews: number;
  hours: string;
  cover: string;
  promo?: string;
  description: string;
};

export const places: Place[] = [
  { id: "cafe-central",  name: "Café Central",     category: "Cafés",        distanceMeters: 200,  rating: 4.6, reviews: 1280, hours: "Aberto até 23:00", cover: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800", promo: "20% OFF em cafés especiais", description: "Cafeteria com grãos especiais, torra artesanal e boa trilha sonora." },
  { id: "sunset-parque", name: "Sunset no Parque", category: "Eventos",      distanceMeters: 2300, rating: 4.8, reviews: 340,  hours: "Hoje · 16:00",     cover: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800", description: "Pôr do sol com DJ set e food trucks no Parque Ibirapuera." },
  { id: "burger-house",  name: "Burger House",     category: "Restaurantes", distanceMeters: 500,  rating: 4.5, reviews: 890,  hours: "Aberto até 00:00", cover: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800", promo: "Combo duplo por R$ 39", description: "Smash burgers, batata rústica e chopes gelados." },
  { id: "vinil-store",   name: "Vinil & Cia",      category: "Lojas",        distanceMeters: 900,  rating: 4.7, reviews: 210,  hours: "Aberto até 20:00", cover: "https://images.unsplash.com/photo-1483412033650-1015ddeb83d1?w=800", description: "Discos raros, toca-discos e acessórios." },
];

export const suggestions = [
  { label: "Shopping Ibirapuera", distance: "2,4 km", icon: "🛍️" },
  { label: "Aeroporto de Congonhas", distance: "7,1 km", icon: "✈️" },
  { label: "Av. Paulista, 1000", distance: "3,2 km", icon: "📍" },
];

export const notifications = [
  { id: "n1", text: "3 pessoas indo para o mesmo destino que você", time: "Agora", type: "social" as const },
  { id: "n2", text: "Evento começando perto de você: Sunset no Parque", time: "5 min", type: "event" as const },
  { id: "n3", text: "20% OFF no Café Central a 200 m de você", time: "10 min", type: "promo" as const },
  { id: "n4", text: "Juliana aceitou sua solicitação de chat", time: "1 h", type: "chat" as const },
];

export const allInterests = [
  "Viagens", "Socializar", "Eventos", "Música", "Esportes", "Tecnologia",
  "Gastronomia", "Arte", "Games", "Moda", "Negócios", "Pets",
  "Cinema", "Literatura", "Yoga", "Café",
];
