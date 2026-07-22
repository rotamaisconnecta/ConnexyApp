export function calculateAveragePerTrip(total: number, trips: number): number {
  if (trips === 0) return 0;
  return Math.round((total / trips) * 100) / 100;
}

export function getEarningsTrend(earnings: number[], period: string): "up" | "down" | "stable" {
  if (earnings.length < 2) return "stable";

  const recent = earnings.slice(-Math.min(earnings.length, 3));
  const older = earnings.slice(0, Math.max(0, earnings.length - Math.min(earnings.length, 3)));

  const recentAvg = recent.reduce((sum, e) => sum + e, 0) / recent.length;
  const olderAvg =
    older.length > 0 ? older.reduce((sum, e) => sum + e, 0) / older.length : recentAvg;

  const diff = recentAvg - olderAvg;
  const threshold = olderAvg * 0.1;

  if (diff > threshold) return "up";
  if (diff < -threshold) return "down";
  return "stable";
}

export function formatEarnings(value: number): string {
  return `R$ ${value.toFixed(2).replace(".", ",")}`;
}

export function getBestHour(earnings: { hour: number; amount: number }[]): number {
  if (earnings.length === 0) return 0;
  return earnings.reduce((best, current) => (current.amount > best.amount ? current : best)).hour;
}

export function getWeeklyGoalProgress(current: number, goal: number): number {
  if (goal <= 0) return 0;
  const progress = (current / goal) * 100;
  return Math.min(Math.round(progress * 100) / 100, 100);
}
