import { RemoteErrorCode, RemoteRepositoryError } from "./errors";

export function canonicalUserPair(
  userIdA: string,
  userIdB: string,
): {
  user_a_id: string;
  user_b_id: string;
} {
  if (!userIdA || !userIdB || userIdA === userIdB) {
    throw new RemoteRepositoryError(
      "Connection requires two distinct identities",
      RemoteErrorCode.VALIDATION,
    );
  }
  return userIdA < userIdB
    ? { user_a_id: userIdA, user_b_id: userIdB }
    : { user_a_id: userIdB, user_b_id: userIdA };
}
