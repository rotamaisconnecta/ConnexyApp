import {
  getDemoGroupInvitesForUser,
  getPendingRequests,
  type DemoGroup,
  type DemoRequest,
} from "@/lib/demo/demo-db";
import {
  listIncomingOutingInvites,
  type OutingInvite,
  type OutingInviteStatusValue,
} from "@/lib/marketplace/outing-invites";

export type LocalConversationInviteItem = {
  kind: "conversation_invite";
  id: string;
  requestId: string;
  fromUserId: string;
  toUserId: string;
  message: string;
  createdAt: number;
};

export type LocalGroupInviteItem = {
  kind: "group_invite";
  id: string;
  groupId: string;
  name: string;
  createdAt: number;
};

export type LocalOutingInviteItem = {
  kind: "outing_invite";
  id: string;
  inviteId: string;
  fromUserId: string;
  toUserId: string;
  targetId: string;
  targetTitle: string;
  message: string;
  status: OutingInviteStatusValue;
  createdAt: number;
};

export type LocalInboxItem =
  | LocalConversationInviteItem
  | LocalGroupInviteItem
  | LocalOutingInviteItem;

function fromConversationRequest(request: DemoRequest): LocalConversationInviteItem {
  return {
    kind: "conversation_invite",
    id: `conversation-invite:${request.id}`,
    requestId: request.id,
    fromUserId: request.fromUserId,
    toUserId: request.toUserId,
    message: request.message,
    createdAt: request.createdAt,
  };
}

function fromGroupInvite(group: DemoGroup): LocalGroupInviteItem {
  return {
    kind: "group_invite",
    id: `group-invite:${group.id}`,
    groupId: group.id,
    name: group.name,
    createdAt: group.createdAt,
  };
}

function fromOutingInvite(invite: OutingInvite): LocalOutingInviteItem {
  return {
    kind: "outing_invite",
    id: `outing-invite:${invite.id}`,
    inviteId: invite.id,
    fromUserId: invite.fromUserId,
    toUserId: invite.personId,
    targetId: invite.targetId,
    targetTitle: invite.targetTitle || invite.targetId,
    message: invite.message,
    status: invite.status,
    createdAt: invite.createdAt,
  };
}

/** Projection of 1D-2 social state and outing invites. Does not persist a second invite. */
export function listLocalInboxItems(userId: string): LocalInboxItem[] {
  const conversationInvites = getPendingRequests(userId).map(fromConversationRequest);
  const groupInvites = getDemoGroupInvitesForUser(userId).map(fromGroupInvite);
  const outingInvites = listIncomingOutingInvites(userId).map(fromOutingInvite);
  return [...conversationInvites, ...groupInvites, ...outingInvites].sort(
    (left, right) => right.createdAt - left.createdAt,
  );
}
