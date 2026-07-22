export function getRankTitle(checkinCount: number): string {
  if (checkinCount === 0) return "Novato";
  if (checkinCount <= 3) return "Explorador";
  if (checkinCount <= 10) return "Frequentador";
  if (checkinCount <= 25) return "Viciado";
  return "Lenda";
}

export function getRankEmoji(checkinCount: number): string {
  if (checkinCount === 0) return "🌱";
  if (checkinCount <= 3) return "🗺️";
  if (checkinCount <= 10) return "📍";
  if (checkinCount <= 25) return "🔥";
  return "👑";
}

export function getRankColor(checkinCount: number): string {
  if (checkinCount === 0) return "text-gray-500";
  if (checkinCount <= 3) return "text-blue-500";
  if (checkinCount <= 10) return "text-green-500";
  if (checkinCount <= 25) return "text-orange-500";
  return "text-purple-500";
}

export function getNextRank(checkinCount: number): { title: string; needed: number } {
  if (checkinCount === 0) return { title: "Explorador", needed: 1 };
  if (checkinCount <= 3) return { title: "Frequentador", needed: 4 - checkinCount };
  if (checkinCount <= 10) return { title: "Viciado", needed: 11 - checkinCount };
  if (checkinCount <= 25) return { title: "Lenda", needed: 26 - checkinCount };
  return { title: "Lenda", needed: 0 };
}

export function calculateStreak(checkins: Date[]): number {
  if (checkins.length === 0) return 0;

  const sorted = [...checkins].sort((a, b) => b.getTime() - a.getTime());
  const uniqueDays = new Set(
    sorted.map((d) => {
      const date = new Date(d);
      date.setHours(0, 0, 0, 0);
      return date.getTime();
    }),
  );

  const days = Array.from(uniqueDays).sort((a, b) => b - a);
  let streak = 1;

  for (let i = 1; i < days.length; i++) {
    const diff = days[i - 1] - days[i];
    if (diff === 86400000) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}
