import { createFileRoute } from "@tanstack/react-router";
import { StatusBar } from "@/components/phone-frame";
import { Feed } from "@/components/feed/feed";
import { currentUser } from "@/lib/mock-data";
import { FeedItemType, type FeedItem } from "@/lib/feed/feed-types";

const MOCK_FEED_ITEMS: FeedItem[] = [
  {
    id: "f1",
    type: FeedItemType.POST,
    author: {
      id: "beatriz",
      name: "Beatriz Silva",
      photo: "https://i.pravatar.cc/80?img=47",
      handle: "bea.vinil",
      online: true,
    },
    createdAt: new Date(Date.now() - 30 * 60 * 1000),
    distance: 150,
    interests: ["Música", "Café"],
    location: { name: "Café Central", distance: 150 },
    visibility: "public",
    priority: 8,
    data: {
      kind: "POST",
      text: "Descoberta da semana: novo blend da casa 🤎 Café com notas de chocolate e caramelo. Imperdível!",
      photos: ["https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800"],
      likes: 24,
      comments: 5,
      shares: 2,
    },
  },
  {
    id: "f2",
    type: FeedItemType.MOMENT,
    author: {
      id: "carlos",
      name: "Carlos Souza",
      photo: "https://i.pravatar.cc/80?img=12",
      handle: "carlos.s",
      online: true,
    },
    createdAt: new Date(Date.now() - 10 * 60 * 1000),
    distance: 80,
    interests: [],
    location: { name: "Vinil Store" },
    visibility: "public",
    priority: 9,
    data: {
      kind: "MOMENT",
      text: "Procurando discos raros no Vinil Store",
      emoji: "🎵",
      placeName: "Vinil Store",
      expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
      active: true,
    },
  },
  {
    id: "f3",
    type: FeedItemType.EVENT,
    author: {
      id: "system",
      name: "Connexy",
      photo: "https://i.pravatar.cc/80?img=1",
      handle: "connexy",
    },
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    distance: 450,
    interests: ["Eventos", "Networking"],
    location: { name: "Parque Ibirapuera" },
    visibility: "public",
    priority: 7,
    data: {
      kind: "EVENT",
      name: "Sunset no Parque",
      banner: "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=800",
      date: "Sáb, 26 Jul",
      time: "17:00",
      participants: 128,
    },
  },
  {
    id: "f4",
    type: FeedItemType.PLACE,
    author: {
      id: "system",
      name: "Connexy",
      photo: "https://i.pravatar.cc/80?img=1",
      handle: "connexy",
    },
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
    distance: 200,
    interests: ["Café"],
    location: { name: "Café Central" },
    visibility: "public",
    priority: 6,
    data: {
      kind: "PLACE",
      name: "Café Central",
      category: "Cafés",
      cover: "https://images.unsplash.com/photo-1483412033650-1015ddeb83d1?w=800",
      rating: 4.6,
    },
  },
  {
    id: "f5",
    type: FeedItemType.OFFER,
    author: {
      id: "system",
      name: "Connexy",
      photo: "https://i.pravatar.cc/80?img=1",
      handle: "connexy",
    },
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
    distance: 300,
    interests: ["Negócios"],
    location: { name: "Burger House" },
    visibility: "public",
    priority: 5,
    data: {
      kind: "OFFER",
      title: "Combo Duplo Especial",
      image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800",
      discount: "30% OFF",
      company: "Burger House",
      validUntil: "31 Jul",
    },
  },
  {
    id: "f6",
    type: FeedItemType.NETWORKING,
    author: {
      id: "system",
      name: "Connexy",
      photo: "https://i.pravatar.cc/80?img=1",
      handle: "connexy",
    },
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
    distance: 120,
    interests: ["Networking", "Tecnologia"],
    location: null,
    visibility: "public",
    priority: 8,
    data: {
      kind: "NETWORKING",
      person: {
        id: "giulia",
        name: "Giulia Santos",
        photo: "https://i.pravatar.cc/80?img=23",
        handle: "giulia.s",
        online: true,
      },
      compatibility: 87,
      sharedInterests: ["Tecnologia", "Networking", "Música"],
    },
  },
  {
    id: "f7",
    type: FeedItemType.ROUTE,
    author: {
      id: "pedro",
      name: "Pedro Lima",
      photo: "https://i.pravatar.cc/80?img=15",
      handle: "pedro.l",
      online: true,
    },
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
    distance: 350,
    interests: [],
    location: null,
    visibility: "public",
    priority: 4,
    data: {
      kind: "ROUTE",
      origin: "Av. Paulista",
      destination: "Shopping Ibirapuera",
      driver: {
        id: "pedro",
        name: "Pedro Lima",
        photo: "https://i.pravatar.cc/80?img=15",
        handle: "pedro.l",
        online: true,
      },
      departureTime: "14:30",
      seatsAvailable: 3,
    },
  },
  {
    id: "f8",
    type: FeedItemType.POST,
    author: {
      id: "ana",
      name: "Ana Oliveira",
      photo: "https://i.pravatar.cc/80?img=32",
      handle: "ana.o",
      online: false,
    },
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
    distance: 600,
    interests: ["Arte", "Cinema"],
    location: { name: "MASP" },
    visibility: "public",
    priority: 6,
    data: {
      kind: "POST",
      text: "Exposição incrível no MASP hoje! Quem mais veio?",
      photos: [
        "https://images.unsplash.com/photo-1544967082-d9d25d867d66?w=800",
        "https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=800",
      ],
      likes: 42,
      comments: 8,
      shares: 3,
    },
  },
];

export const Route = createFileRoute("/_app/feed")({
  head: () => ({ meta: [{ title: "Feed — Connexy" }] }),
  component: FeedPage,
});

function FeedPage() {
  return (
    <div className="flex-1 pb-6">
      <StatusBar />

      <header className="px-5 pt-1 pb-3">
        <h1 className="font-display font-bold text-lg">Feed</h1>
      </header>

      <div className="px-4">
        <Feed items={MOCK_FEED_ITEMS} userName={currentUser.name} userPhoto={currentUser.photo} />
      </div>
    </div>
  );
}
