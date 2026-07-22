import {
  type Recommendation,
  type EngineContext,
  type EngineNotification,
  type RecommendationTypeValue,
  type RecommendationReasonValue,
  RecommendationType,
  RecommendationReason,
  ContextDay,
} from "./engine-types";

export function generateSmartNotifications(
  recs: Recommendation[],
  ctx: EngineContext,
): EngineNotification[] {
  const now = ctx.timestamp;
  const notifications: EngineNotification[] = [];

  const topRecs = [...recs].sort((a, b) => b.score.total - a.score.total).slice(0, 10);

  for (const rec of topRecs) {
    if (rec.score.total < 60) continue;

    let title = "";
    let body = "";
    let icon = "";
    let reason: RecommendationReasonValue = RecommendationReason.INTERESSE;

    switch (rec.type) {
      case RecommendationType.PERSON:
        if (rec.metadata.kind === "person") {
          title = `${rec.title} está por perto`;
          body = `${rec.metadata.compatibilityPercent}% de compatibilidade`;
          icon = rec.imageUrl;
          reason = RecommendationReason.COMPATIBILIDADE;
        }
        break;

      case RecommendationType.EVENT:
        if (rec.metadata.kind === "event") {
          title = `Evento: ${rec.title}`;
          body = `${rec.metadata.attendingCount} pessoas confirmadas`;
          icon = rec.imageUrl;
          reason = RecommendationReason.EVENTO;
        }
        break;

      case RecommendationType.BUSINESS:
        if (rec.metadata.kind === "business") {
          title = `${rec.title} está recomendado`;
          body = `Nota ${rec.metadata.rating} • ${rec.metadata.reviewCount} avaliações`;
          icon = rec.imageUrl;
          reason = RecommendationReason.POPULARIDADE;
        }
        break;

      case RecommendationType.OFFER:
        if (rec.metadata.kind === "offer") {
          title = `Oferta imperdível: ${rec.title}`;
          body = `${rec.metadata.discountPercent}% de desconto`;
          icon = rec.imageUrl;
          reason = RecommendationReason.HORARIO;
        }
        break;

      case RecommendationType.PLACE:
        if (rec.metadata.kind === "place") {
          title = `${rec.title} está bombando`;
          body = `${rec.metadata.checkInCount} check-ins agora`;
          icon = rec.imageUrl;
          reason = RecommendationReason.TENDENCIA;
        }
        break;

      case RecommendationType.DRIVER:
        if (rec.metadata.kind === "driver") {
          title = `${rec.title} disponível`;
          body = `${rec.metadata.etaMinutes}min • ${rec.metadata.rating}★`;
          icon = rec.imageUrl;
          reason = RecommendationReason.DISTANCIA;
        }
        break;

      default:
        continue;
    }

    if (title) {
      notifications.push({
        id: `notif-${rec.id}`,
        type: rec.type,
        title,
        body,
        icon,
        reason,
        score: rec.score.total,
        actionUrl: `/recommendation/${rec.id}`,
        createdAt: now,
        read: false,
      });
    }
  }

  return notifications;
}

export function prioritizeNotifications(notifs: EngineNotification[]): EngineNotification[] {
  return [...notifs].sort((a, b) => b.score - a.score);
}

export function filterUnread(notifs: EngineNotification[]): EngineNotification[] {
  return notifs.filter((n) => !n.read);
}

export function getNotificationByType(
  notifs: EngineNotification[],
  type: RecommendationTypeValue,
): EngineNotification[] {
  return notifs.filter((n) => n.type === type);
}

export function getNotificationCountByType(
  notifs: EngineNotification[],
): Record<RecommendationTypeValue, number> {
  const counts = {} as Record<RecommendationTypeValue, number>;

  for (const key of Object.values(RecommendationType)) {
    counts[key] = 0;
  }

  for (const n of notifs) {
    counts[n.type] = (counts[n.type] || 0) + 1;
  }

  return counts;
}
