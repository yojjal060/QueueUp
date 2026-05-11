import assert from "node:assert/strict";
import { io as createClient, type Socket } from "socket.io-client";
import { prisma } from "../libs/prisma.js";

const TEST_PREFIX = `RT${Date.now().toString(36)}`;
const ACK_TIMEOUT_MS = 2_000;
const EVENT_TIMEOUT_MS = 2_500;
const DISCONNECT_GRACE_MS = 600;

process.env.SOCKET_DISCONNECT_GRACE_MS = String(DISCONNECT_GRACE_MS);

type ApiSuccess<T> = {
  success: true;
  data: T;
  nextCursor?: string | null;
};

type ApiError = {
  error: string;
  message: string;
  details?: Record<string, unknown>;
};

type CreatedUser = {
  id: string;
  username: string;
  sessionToken: string;
};

type CreatedLobby = {
  id: string;
  code: string;
  title: string;
};

type AckSuccess<T> = {
  ok: true;
  data: T;
};

type AckFailure = {
  ok: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
};

type AckResponse<T> = AckSuccess<T> | AckFailure;

function assertApiSuccess<T>(
  response: {
    status: number;
    body: ApiSuccess<T> | ApiError;
  }
): asserts response is {
  status: number;
  body: ApiSuccess<T>;
} {
  assert.ok("success" in response.body, `Expected success response, got ${response.status}`);
}

function assertApiError<T>(
  response: {
    status: number;
    body: ApiSuccess<T> | ApiError;
  }
): asserts response is {
  status: number;
  body: ApiError;
} {
  assert.ok("error" in response.body, `Expected error response, got ${response.status}`);
}

async function cleanupTestData() {
  const lobbies = await prisma.lobby.findMany({
    where: {
      title: {
        startsWith: TEST_PREFIX,
      },
    },
    select: {
      id: true,
    },
  });

  const lobbyIds = lobbies.map((lobby) => lobby.id);

  if (lobbyIds.length > 0) {
    await prisma.message.deleteMany({
      where: {
        lobbyId: {
          in: lobbyIds,
        },
      },
    });

    await prisma.lobbyMember.deleteMany({
      where: {
        lobbyId: {
          in: lobbyIds,
        },
      },
    });

    await prisma.lobby.deleteMany({
      where: {
        id: {
          in: lobbyIds,
        },
      },
    });
  }

  await prisma.user.deleteMany({
    where: {
      username: {
        startsWith: TEST_PREFIX,
      },
    },
  });
}

async function apiRequest<T>(
  baseUrl: string,
  path: string,
  options: {
    method?: string;
    body?: unknown;
    sessionToken?: string;
  } = {}
) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: options.method ?? "GET",
    headers: {
      "content-type": "application/json",
      ...(options.sessionToken
        ? { "x-session-token": options.sessionToken }
        : {}),
    },
    ...(options.body !== undefined
      ? { body: JSON.stringify(options.body) }
      : {}),
  });

  const payload = (await response.json()) as ApiSuccess<T> | ApiError;

  return {
    status: response.status,
    body: payload,
  };
}

async function createUser(baseUrl: string, label: string) {
  const response = await apiRequest<CreatedUser>(baseUrl, "/api/users", {
    method: "POST",
    body: {
      username: `${TEST_PREFIX}_${label}`,
    },
  });

  assert.equal(response.status, 201, `Expected user creation for ${label}`);
  assertApiSuccess(response);
  return response.body.data;
}

async function connectClientSocket(baseUrl: string, sessionToken: string) {
  return new Promise<Socket>((resolve, reject) => {
    const socket = createClient(baseUrl, {
      auth: { sessionToken },
      reconnection: false,
      timeout: ACK_TIMEOUT_MS,
      transports: ["websocket"],
    });

    socket.once("connect", () => resolve(socket));
    socket.once("connect_error", (error) => reject(error));
  });
}

async function expectConnectError(baseUrl: string) {
  return new Promise<void>((resolve, reject) => {
    const socket = createClient(baseUrl, {
      auth: {},
      reconnection: false,
      timeout: ACK_TIMEOUT_MS,
      transports: ["websocket"],
    });

    socket.once("connect", () => {
      socket.close();
      reject(new Error("Expected unauthenticated socket connection to fail"));
    });

    socket.once("connect_error", (error) => {
      assert.match(error.message, /Unauthorized/i);
      socket.close();
      resolve();
    });
  });
}

async function emitAck<T>(
  socket: Socket,
  event: string,
  payload: Record<string, unknown>
) {
  return new Promise<AckResponse<T>>((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(`Timed out waiting for ack for ${event}`));
    }, ACK_TIMEOUT_MS);

    socket.emit(event, payload, (response: AckResponse<T>) => {
      clearTimeout(timeout);
      resolve(response);
    });
  });
}

async function waitForEvent<T>(socket: Socket, event: string) {
  return new Promise<T>((resolve, reject) => {
    const timeout = setTimeout(() => {
      socket.off(event, onEvent);
      reject(new Error(`Timed out waiting for ${event}`));
    }, EVENT_TIMEOUT_MS);

    const onEvent = (payload: T) => {
      clearTimeout(timeout);
      socket.off(event, onEvent);
      resolve(payload);
    };

    socket.on(event, onEvent);
  });
}

async function expectNoEvent(socket: Socket, event: string, durationMs: number) {
  return new Promise<void>((resolve, reject) => {
    const onEvent = () => {
      clearTimeout(timeout);
      socket.off(event, onEvent);
      reject(new Error(`Did not expect ${event}`));
    };

    const timeout = setTimeout(() => {
      socket.off(event, onEvent);
      resolve();
    }, durationMs);

    socket.on(event, onEvent);
  });
}

async function main() {
  await cleanupTestData();

  const { createQueueUpServer } = await import("../server.js");
  const { httpServer, io } = createQueueUpServer();

  await new Promise<void>((resolve) => {
    httpServer.listen(0, resolve);
  });

  const address = httpServer.address();
  assert.ok(address && typeof address !== "string", "Expected HTTP server port");
  const baseUrl = `http://127.0.0.1:${address.port}`;

  const openSockets: Socket[] = [];

  try {
    await expectConnectError(baseUrl);

    const host = await createUser(baseUrl, "HOST");
    const member = await createUser(baseUrl, "MEMBER");
    const outsider = await createUser(baseUrl, "OUTSIDER");

    const hostLobbyResponse = await apiRequest<CreatedLobby>(baseUrl, "/api/lobbies", {
      method: "POST",
      sessionToken: host.sessionToken,
      body: {
        title: `${TEST_PREFIX}_Lobby_One`,
        game: "PUBG_MOBILE",
        visibility: "PUBLIC",
        maxPlayers: 4,
        hostRank: "ACE",
      },
    });

    assert.equal(hostLobbyResponse.status, 201);
    assertApiSuccess(hostLobbyResponse);
    const lobbyOne = hostLobbyResponse.body.data;

    const secondCreateResponse = await apiRequest<CreatedLobby>(
      baseUrl,
      "/api/lobbies",
      {
        method: "POST",
        sessionToken: host.sessionToken,
        body: {
          title: `${TEST_PREFIX}_Lobby_Two_Fail`,
          game: "PUBG_MOBILE",
          visibility: "PUBLIC",
          maxPlayers: 4,
          hostRank: "ACE",
        },
      }
    );

    assert.equal(secondCreateResponse.status, 409);
    assertApiError(secondCreateResponse);
    assert.equal(secondCreateResponse.body.error, "ActiveLobbyConflict");
    assert.equal(
      secondCreateResponse.body.details?.activeLobbyCode,
      lobbyOne.code
    );

    const outsiderSocket = await connectClientSocket(baseUrl, outsider.sessionToken);
    openSockets.push(outsiderSocket);

    const outsiderJoin = await emitAck<{ lobbyCode: string }>(
      outsiderSocket,
      "lobby:join",
      { lobbyCode: lobbyOne.code }
    );

    assert.equal(outsiderJoin.ok, false);
    if (!outsiderJoin.ok) {
      assert.equal(outsiderJoin.error.code, "LobbyMembershipRequired");
    }

    const hostSocket = await connectClientSocket(baseUrl, host.sessionToken);
    openSockets.push(hostSocket);

    const hostRoomJoin = await emitAck<{ lobby: CreatedLobby }>(
      hostSocket,
      "lobby:join",
      { lobbyCode: lobbyOne.code }
    );

    assert.equal(hostRoomJoin.ok, true);

    const memberSocket = await connectClientSocket(baseUrl, member.sessionToken);
    openSockets.push(memberSocket);

    const joinedEventPromise = waitForEvent<{
      lobbyCode: string;
      member: { userId: string };
    }>(hostSocket, "lobby:member-joined");
    const updatedAfterJoinPromise = waitForEvent<{
      lobby: { code: string; members: Array<{ userId: string }> };
    }>(hostSocket, "lobby:updated");

    const memberJoinResponse = await apiRequest<{ code: string }>(
      baseUrl,
      `/api/lobbies/${lobbyOne.code}/join`,
      {
        method: "POST",
        sessionToken: member.sessionToken,
        body: {
          rank: "DIAMOND",
        },
      }
    );

    assert.equal(memberJoinResponse.status, 200);

    const joinedEvent = await joinedEventPromise;
    assert.equal(joinedEvent.lobbyCode, lobbyOne.code);
    assert.equal(joinedEvent.member.userId, member.id);

    const updatedAfterJoin = await updatedAfterJoinPromise;
    assert.equal(updatedAfterJoin.lobby.code, lobbyOne.code);
    assert.equal(updatedAfterJoin.lobby.members.length, 2);

    const memberRoomJoin = await emitAck<{ lobby: { code: string } }>(
      memberSocket,
      "lobby:join",
      { lobbyCode: lobbyOne.code }
    );

    assert.equal(memberRoomJoin.ok, true);

    const hostChatPromise = waitForEvent<{ message: { content: string } }>(
      hostSocket,
      "chat:new-message"
    );

    const chatAck = await emitAck<{ message: { content: string } }>(
      memberSocket,
      "chat:message",
      {
        lobbyCode: lobbyOne.code,
        content: "Realtime smoke test message",
      }
    );

    assert.equal(chatAck.ok, true);
    const hostChat = await hostChatPromise;
    assert.equal(hostChat.message.content, "Realtime smoke test message");

    const messagesResponse = await apiRequest<Array<{ content: string }>>(
      baseUrl,
      `/api/lobbies/${lobbyOne.code}/messages`
    );

    assert.equal(messagesResponse.status, 200);
    assertApiSuccess(messagesResponse);
    assert.ok(
      messagesResponse.body.data.some(
        (message: { content: string }) =>
          message.content === "Realtime smoke test message"
      )
    );

    const memberSawHostLeavePromise = waitForEvent<{
      lobbyCode: string;
      userId: string;
      newHostId: string | null;
      lobbyClosed: boolean;
    }>(memberSocket, "lobby:member-left");
    const memberSawHostTransferPromise = waitForEvent<{
      lobby: { members: Array<{ userId: string; role: string }> };
    }>(memberSocket, "lobby:updated");

    const hostLeaveResponse = await apiRequest<{
      lobbyClosed: boolean;
      newHostId: string | null;
    }>(baseUrl, `/api/lobbies/${lobbyOne.code}/leave`, {
      method: "POST",
      sessionToken: host.sessionToken,
    });

    assert.equal(hostLeaveResponse.status, 200);

    const memberSawHostLeave = await memberSawHostLeavePromise;
    assert.equal(memberSawHostLeave.userId, host.id);
    assert.equal(memberSawHostLeave.newHostId, member.id);
    assert.equal(memberSawHostLeave.lobbyClosed, false);

    const memberSawHostTransfer = await memberSawHostTransferPromise;
    const promotedMember = memberSawHostTransfer.lobby.members.find(
      (entry) => entry.userId === member.id
    );
    assert.equal(promotedMember?.role, "HOST");

    const closeEventPromise = waitForEvent<{ lobbyCode: string }>(
      memberSocket,
      "lobby:closed"
    );

    const closeLobbyResponse = await apiRequest<{ lobbyId: string }>(
      baseUrl,
      `/api/lobbies/${lobbyOne.code}/close`,
      {
        method: "POST",
        sessionToken: member.sessionToken,
      }
    );

    assert.equal(closeLobbyResponse.status, 200);
    const closeEvent = await closeEventPromise;
    assert.equal(closeEvent.lobbyCode, lobbyOne.code);

    const secondLobbyResponse = await apiRequest<CreatedLobby>(baseUrl, "/api/lobbies", {
      method: "POST",
      sessionToken: host.sessionToken,
      body: {
        title: `${TEST_PREFIX}_Lobby_Two`,
        game: "PUBG_MOBILE",
        visibility: "PUBLIC",
        maxPlayers: 4,
        hostRank: "ACE",
      },
    });

    assert.equal(secondLobbyResponse.status, 201);
    assertApiSuccess(secondLobbyResponse);
    const lobbyTwo = secondLobbyResponse.body.data;

    const joinSecondLobbyResponse = await apiRequest<{ code: string }>(
      baseUrl,
      `/api/lobbies/${lobbyTwo.code}/join`,
      {
        method: "POST",
        sessionToken: member.sessionToken,
        body: {
          rank: "DIAMOND",
        },
      }
    );

    assert.equal(joinSecondLobbyResponse.status, 200);

    const thirdLobbyOwner = outsider;
    const thirdLobbyResponse = await apiRequest<CreatedLobby>(baseUrl, "/api/lobbies", {
      method: "POST",
      sessionToken: thirdLobbyOwner.sessionToken,
      body: {
        title: `${TEST_PREFIX}_Lobby_Three`,
        game: "PUBG_MOBILE",
        visibility: "PUBLIC",
        maxPlayers: 4,
        hostRank: "ACE",
      },
    });

    assert.equal(thirdLobbyResponse.status, 201);
    assertApiSuccess(thirdLobbyResponse);
    const lobbyThree = thirdLobbyResponse.body.data;

    const joinConflictResponse = await apiRequest<{ code: string }>(
      baseUrl,
      `/api/lobbies/${lobbyThree.code}/join`,
      {
        method: "POST",
        sessionToken: host.sessionToken,
        body: {
          rank: "ACE",
        },
      }
    );

    assert.equal(joinConflictResponse.status, 409);
    assertApiError(joinConflictResponse);
    assert.equal(joinConflictResponse.body.error, "ActiveLobbyConflict");
    assert.equal(joinConflictResponse.body.details?.activeLobbyCode, lobbyTwo.code);

    const secondHostSocket = await connectClientSocket(baseUrl, host.sessionToken);
    openSockets.push(secondHostSocket);

    const secondMemberSocket = await connectClientSocket(baseUrl, member.sessionToken);
    openSockets.push(secondMemberSocket);

    const secondHostJoin = await emitAck<{ lobby: { code: string } }>(
      secondHostSocket,
      "lobby:join",
      { lobbyCode: lobbyTwo.code }
    );
    assert.equal(secondHostJoin.ok, true);

    const secondMemberJoin = await emitAck<{ lobby: { code: string } }>(
      secondMemberSocket,
      "lobby:join",
      { lobbyCode: lobbyTwo.code }
    );
    assert.equal(secondMemberJoin.ok, true);

    secondMemberSocket.disconnect();

    const reconnectedMemberSocket = await connectClientSocket(
      baseUrl,
      member.sessionToken
    );
    openSockets.push(reconnectedMemberSocket);

    const reconnectJoin = await emitAck<{ lobby: { code: string } }>(
      reconnectedMemberSocket,
      "lobby:join",
      { lobbyCode: lobbyTwo.code }
    );
    assert.equal(reconnectJoin.ok, true);

    await expectNoEvent(
      secondHostSocket,
      "lobby:member-left",
      DISCONNECT_GRACE_MS + 250
    );

    const lobbyTwoStateResponse = await apiRequest<{
      members: Array<{ userId: string }>;
    }>(baseUrl, `/api/lobbies/${lobbyTwo.code}`);

    assert.equal(lobbyTwoStateResponse.status, 200);
    assertApiSuccess(lobbyTwoStateResponse);
    assert.equal(lobbyTwoStateResponse.body.data.members.length, 2);

    const autoLeavePromise = waitForEvent<{
      userId: string;
      newHostId: string | null;
      lobbyClosed: boolean;
    }>(secondHostSocket, "lobby:member-left");
    const autoLeaveUpdatedPromise = waitForEvent<{
      lobby: { members: Array<{ userId: string }> };
    }>(secondHostSocket, "lobby:updated");

    reconnectedMemberSocket.disconnect();

    const autoLeave = await autoLeavePromise;
    assert.equal(autoLeave.userId, member.id);
    assert.equal(autoLeave.newHostId, null);
    assert.equal(autoLeave.lobbyClosed, false);

    const autoLeaveUpdated = await autoLeaveUpdatedPromise;
    assert.equal(autoLeaveUpdated.lobby.members.length, 1);

    const finalLobbyTwoState = await apiRequest<{
      members: Array<{ userId: string }>;
    }>(baseUrl, `/api/lobbies/${lobbyTwo.code}`);

    assert.equal(finalLobbyTwoState.status, 200);
    assertApiSuccess(finalLobbyTwoState);
    assert.equal(finalLobbyTwoState.body.data.members.length, 1);

    console.log("Realtime smoke test passed");
  } finally {
    for (const socket of openSockets) {
      if (socket.connected) {
        socket.disconnect();
      } else {
        socket.close();
      }
    }

    io.close();

    await new Promise<void>((resolve, reject) => {
      httpServer.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });

    await cleanupTestData();
    await prisma.$disconnect();
  }
}

void main().catch((error) => {
  console.error("Realtime smoke test failed:", error);
  process.exitCode = 1;
});
