import { prisma } from "../libs/prisma.js";

/**
 * Create a guest user with a username.
 * Returns the user with their session token.
 */
export async function createGuestUser(username: string) {
  return prisma.user.create({
    data: { username },
    select: {
      id: true,
      username: true,
      sessionToken: true,
      avatar: true,
      createdAt: true,
    },
  });
}

/**
 * Get a user by their session token.
 */
export async function getUserBySession(sessionToken: string) {
  return prisma.user.findUnique({
    where: { sessionToken },
    select: {
      id: true,
      username: true,
      sessionToken: true,
      avatar: true,
      createdAt: true,
    },
  });
}

/**
 * Check if a username is already taken.
 */
export async function isUsernameTaken(username: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { username },
    select: { id: true },
  });
  return user !== null;
}