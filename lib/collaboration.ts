/**
 * Collaboration scaffold — types and helpers only.
 * Realtime sync is intentionally not implemented in Phase 8.
 */

export type CollaboratorRole = "owner" | "editor" | "commenter" | "viewer";

export type ProjectShare = {
  id: string;
  projectId: string;
  shareToken: string;
  role: CollaboratorRole;
  createdAt: string;
  expiresAt: string | null;
};

export type ProjectComment = {
  id: string;
  projectId: string;
  authorId: string;
  slideKey: string | null;
  body: string;
  createdAt: string;
  resolved: boolean;
};

export type ProjectInvite = {
  id: string;
  projectId: string;
  email: string;
  role: CollaboratorRole;
  status: "pending" | "accepted" | "revoked";
  invitedAt: string;
};

export type CollaborationMeta = {
  shares: ProjectShare[];
  comments: ProjectComment[];
  invites: ProjectInvite[];
};

export const EMPTY_COLLABORATION: CollaborationMeta = {
  shares: [],
  comments: [],
  invites: [],
};

/** Placeholder for future invite links */
export function buildInvitePath(projectId: string, token: string): string {
  return `/dashboard/${projectId}?invite=${token}`;
}
