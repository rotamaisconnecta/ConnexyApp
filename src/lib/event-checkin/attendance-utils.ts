import { CheckinUser, CheckinStatus } from "./checkin-types";

export function getAttendeesByStatus(users: CheckinUser[], status: CheckinStatus): CheckinUser[] {
  return users.filter((user) => user.status === status);
}

export function getAttendeeCount(users: CheckinUser[]): number {
  return users.length;
}

export function getCheckedInCount(users: CheckinUser[]): number {
  return users.filter((user) => user.status === CheckinStatus.CHECKED_IN).length;
}

export function isUserCheckedIn(users: CheckinUser[], userId: string): boolean {
  return users.some((user) => user.id === userId && user.status === CheckinStatus.CHECKED_IN);
}

export function sortAttendeesByDistance(users: CheckinUser[]): CheckinUser[] {
  return [...users].sort((a, b) => a.distanceMeters - b.distanceMeters);
}

export function getRecentCheckins(users: CheckinUser[], limit: number): CheckinUser[] {
  return users
    .filter((user) => user.checkedInAt !== undefined)
    .sort((a, b) => (b.checkedInAt?.getTime() ?? 0) - (a.checkedInAt?.getTime() ?? 0))
    .slice(0, limit);
}
