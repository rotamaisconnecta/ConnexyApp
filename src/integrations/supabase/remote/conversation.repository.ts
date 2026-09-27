import { requireAuthUserId, type SchemaAClient } from "./client";
import { RemoteErrorCode, RemoteRepositoryError, throwIfPostgrestError } from "./errors";
import { runRemote, unwrapList, unwrapMaybe, unwrapRow } from "./result";
import type {
  ConversationKind,
  ConversationParticipantRow,
  ConversationRow,
  MessageKind,
  MessageRow,
  ParticipantStatus,
} from "./types";

export class RemoteConversationRepository {
  constructor(private readonly client: SchemaAClient) {}

  async createDirect(otherUserId: string): Promise<{
    conversation: ConversationRow;
    participants: ConversationParticipantRow[];
  }> {
    return runRemote(async () => {
      const uid = await requireAuthUserId(this.client);
      if (uid === otherUserId) {
        throw new RemoteRepositoryError(
          "Direct conversation requires two identities",
          RemoteErrorCode.VALIDATION,
        );
      }
      const conversationId = crypto.randomUUID();
      const inserted = await this.client.from("conversations").insert({
        id: conversationId,
        created_by: uid,
        kind: "direct" satisfies ConversationKind,
      });
      throwIfPostgrestError(inserted.error, inserted.status);
      const selfInsert = await this.client.from("conversation_participants").insert({
        conversation_id: conversationId,
        user_id: uid,
        status: "accepted" satisfies ParticipantStatus,
      });
      throwIfPostgrestError(selfInsert.error, selfInsert.status);
      const otherInsert = await this.client.from("conversation_participants").insert({
        conversation_id: conversationId,
        user_id: otherUserId,
        status: "accepted" satisfies ParticipantStatus,
      });
      throwIfPostgrestError(otherInsert.error, otherInsert.status);
      const conversation = unwrapRow(
        await this.client.from("conversations").select("*").eq("id", conversationId).maybeSingle(),
        "Conversation was not created",
      );
      const participants = unwrapList(
        await this.client
          .from("conversation_participants")
          .select("*")
          .eq("conversation_id", conversationId),
      );
      return { conversation, participants };
    });
  }

  async get(id: string): Promise<ConversationRow | null> {
    return runRemote(async () => {
      await requireAuthUserId(this.client);
      return unwrapMaybe(
        await this.client.from("conversations").select("*").eq("id", id).maybeSingle(),
      );
    });
  }

  async listMine(): Promise<ConversationRow[]> {
    return runRemote(async () => {
      await requireAuthUserId(this.client);
      return unwrapList(
        await this.client
          .from("conversations")
          .select("*")
          .order("updated_at", { ascending: false }),
      );
    });
  }

  async listParticipants(conversationId: string): Promise<ConversationParticipantRow[]> {
    return runRemote(async () => {
      await requireAuthUserId(this.client);
      return unwrapList(
        await this.client
          .from("conversation_participants")
          .select("*")
          .eq("conversation_id", conversationId),
      );
    });
  }

  async getOwnParticipant(conversationId: string): Promise<ConversationParticipantRow | null> {
    return runRemote(async () => {
      const uid = await requireAuthUserId(this.client);
      return unwrapMaybe(
        await this.client
          .from("conversation_participants")
          .select("*")
          .eq("conversation_id", conversationId)
          .eq("user_id", uid)
          .maybeSingle(),
      );
    });
  }

  async setPinned(conversationId: string, pinned: boolean): Promise<ConversationParticipantRow> {
    return runRemote(async () => {
      const uid = await requireAuthUserId(this.client);
      return unwrapRow(
        await this.client
          .from("conversation_participants")
          .update({ pinned })
          .eq("conversation_id", conversationId)
          .eq("user_id", uid)
          .select("*")
          .single(),
        "Participant not found",
      );
    });
  }

  async markRead(
    conversationId: string,
    at: string = new Date().toISOString(),
  ): Promise<ConversationParticipantRow> {
    return runRemote(async () => {
      const uid = await requireAuthUserId(this.client);
      return unwrapRow(
        await this.client
          .from("conversation_participants")
          .update({ last_read_at: at })
          .eq("conversation_id", conversationId)
          .eq("user_id", uid)
          .select("*")
          .single(),
        "Participant not found",
      );
    });
  }

  async sendMessage(input: {
    conversationId: string;
    text: string;
    kind?: MessageKind;
  }): Promise<MessageRow> {
    return runRemote(async () => {
      const uid = await requireAuthUserId(this.client);
      const kind = input.kind ?? "text";
      const message = unwrapRow(
        await this.client
          .from("messages")
          .insert({
            conversation_id: input.conversationId,
            sender_id: uid,
            kind,
            text: input.text,
          })
          .select("*")
          .single(),
        "Message was not created",
      );
      await this.tryTouchConversationPreview(
        input.conversationId,
        input.text,
        kind,
        message.created_at,
      );
      return message;
    });
  }

  async listMessages(conversationId: string): Promise<MessageRow[]> {
    return runRemote(async () => {
      await requireAuthUserId(this.client);
      return unwrapList(
        await this.client
          .from("messages")
          .select("*")
          .eq("conversation_id", conversationId)
          .order("created_at", { ascending: true }),
      );
    });
  }

  private async tryTouchConversationPreview(
    conversationId: string,
    text: string,
    kind: MessageKind,
    at: string,
  ): Promise<void> {
    const result = await this.client
      .from("conversations")
      .update({
        last_message_text: text,
        last_message_kind: kind,
        last_message_at: at,
      })
      .eq("id", conversationId);
    if (result.error) {
      // Preview is denormalized; only the creator may update the conversation row.
      return;
    }
  }
}
