import type { Role } from "@/lib/dashboard";

export {};

declare global {
  /** What Quairy keeps in a Clerk user's public metadata. */
  interface UserPublicMetadata {
    role?: Role;
  }

  /** Session token claims, when the token is customized to carry the public metadata. */
  interface CustomJwtSessionClaims {
    metadata?: UserPublicMetadata;
  }
}
