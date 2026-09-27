/**
 * Classification of local fields that must not become Schema A columns.
 * REMOTE = stored remotely; LOCAL DERIVED = calculated in app; MOCK = fixture/UI;
 * FUTURE = deferred (Schema B / later contract).
 */
export const FieldKind = {
  REMOTE: "REMOTE",
  LOCAL_DERIVED: "LOCAL DERIVED",
  MOCK: "MOCK",
  FUTURE: "FUTURE",
  UNMAPPED: "UNMAPPED",
} as const;

export type FieldKindValue = (typeof FieldKind)[keyof typeof FieldKind];

export const FIELD_CLASSIFICATION = {
  "DemoIdentity.id (lucas/beatriz)": FieldKind.UNMAPPED,
  "DemoOwnProfile.age": FieldKind.LOCAL_DERIVED,
  "DemoOwnProfile.privateAddresses": FieldKind.REMOTE,
  "DemoLocalSettings.twoFactor": FieldKind.FUTURE,
  "DemoLocalSettings.payment": FieldKind.FUTURE,
  "DemoLocalSettings.language → profiles.locale": FieldKind.REMOTE,
  "DemoRequest.message": FieldKind.UNMAPPED,
  "DemoConnection.conversationId (required local)": FieldKind.REMOTE,
  "StoredConversation.pinnedByUserIds": FieldKind.LOCAL_DERIVED,
  "StoredConversation.gestureHandledAt (shared)": FieldKind.LOCAL_DERIVED,
  "participant.pinned / last_read_at": FieldKind.REMOTE,
  "MockConversation.unreadCount": FieldKind.LOCAL_DERIVED,
  "MockConversation.isOnline / proximityMeters": FieldKind.MOCK,
  "StoredMessage.from (me|them)": FieldKind.LOCAL_DERIVED,
  "StoredMessage.senderName": FieldKind.UNMAPPED,
  "message.isUnread": FieldKind.UNMAPPED,
  "DemoPost.authorName/photo/handle": FieldKind.UNMAPPED,
  "PostPrivacy.FRIENDS": FieldKind.UNMAPPED,
  "StoredReel.persistence": FieldKind.UNMAPPED,
  "StoredReel.author snapshot": FieldKind.UNMAPPED,
  "StoredReelComment.likes / likedByMe": FieldKind.UNMAPPED,
  "Reel video blob (IndexedDB media)": FieldKind.UNMAPPED,
  "CatalogEvent status UPCOMING": FieldKind.LOCAL_DERIVED,
  "ReservationStatus.completed": FieldKind.UNMAPPED,
  "ReservationStatus.requested → pending": FieldKind.REMOTE,
  "demo auto-confirm on create": FieldKind.UNMAPPED,
  "saved-details untyped ids": FieldKind.UNMAPPED,
  "Carona → Connection + DM": FieldKind.FUTURE,
  "Product / Service / Order": FieldKind.FUTURE,
} as const;
