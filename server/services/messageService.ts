import { prisma } from "../libs/prisma.js";
import type { Prisma } from "../generated/prisma/client.js";

const messageWithUser = {
  user: {
    select: {
      id: true,
      username: true,
      avatar: true,
    },
  },
} satisfies Prisma.MessageInclude;

export type MessageWithUser = Prisma.MessageGetPayload<{
  include: typeof messageWithUser;
}>;

export interface ListLobbyMessagesOptions {
  cursor?: string;
  limit?: number;
}

export async function listLobbyMessages(
  lobbyId: string,
  options: ListLobbyMessagesOptions = {}
) {
  const take = Math.min(options.limit ?? 50, 100);

  const messages = await prisma.message.findMany({
    where: { lobbyId },
    include: messageWithUser,
    orderBy: { createdAt: "desc" },
    take,
    ...(options.cursor
      ? {
          skip: 1,
          cursor: { id: options.cursor },
        }
      : {}),
  });

  return {
    messages: messages.reverse(),
    nextCursor: messages.length === take ? messages[0]?.id ?? null : null,
  };
}

export async function createLobbyMessage(
  lobbyId: string,
  userId: string,
  content: string
): Promise<MessageWithUser> {
  return prisma.message.create({
    data: {
      lobbyId,
      userId,
      content,
    },
    include: messageWithUser,
  });
}
