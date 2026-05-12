import {
  startTransition,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
} from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router";
import { LobbyChat, type ChatSystemMessage } from "../components/LobbyChat";
import { SessionPanel } from "../components/SessionPanel";
import { StatusBanner } from "../components/StatusBanner";
import { useSession } from "../context/useSession";
import { useGames } from "../hooks/useGames";
import {
  ApiError,
  closeLobby as closeLobbyRequest,
  getLobby,
  getLobbyMessages,
  joinLobby,
  kickLobbyMember as kickLobbyMemberRequest,
  leaveLobby as leaveLobbyRequest,
} from "../services/api";
import {
  createLobbySocket,
  type QueueUpClientSocket,
} from "../services/socket";
import type { Lobby, Message } from "../types/api";
import {
  formatGameId,
  formatRank,
  formatRelativeTime,
  formatVisibility,
} from "../utils/formatters";
import { getGamePresentation, getInitials } from "../utils/presentation";

interface RoomBanner {
  tone: "info" | "success" | "error";
  title: string;
  message: string;
}

type ChatAckResponse =
  | { ok: true; data: { message: Message } }
  | { ok: false; error: { message: string } };

function createSystemMessage(
  content: string,
  tone: ChatSystemMessage["tone"] = "info"
): ChatSystemMessage {
  const id =
    typeof window !== "undefined" && window.crypto?.randomUUID
      ? window.crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  return {
    id,
    content,
    tone,
    createdAt: new Date().toISOString(),
  };
}

function getRoomErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Could not load this lobby.";
}

export function LobbyPreviewPage() {
  const { code = "" } = useParams();
  const normalizedCode = code.trim().toUpperCase();
  const location = useLocation();
  const navigate = useNavigate();
  const { session } = useSession();
  const { games } = useGames();
  const [lobby, setLobby] = useState<Lobby | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [systemMessages, setSystemMessages] = useState<ChatSystemMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [banner, setBanner] = useState<RoomBanner | null>(
    typeof (location.state as { notice?: unknown } | null)?.notice === "string"
      ? {
          tone: "success",
          title: "Room ready",
          message: (location.state as { notice?: string }).notice ?? "",
        }
      : null
  );
  const [joinRank, setJoinRank] = useState("");
  const [joinError, setJoinError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [kickingUserId, setKickingUserId] = useState<string | null>(null);
  const [connectionState, setConnectionState] = useState<
    "idle" | "connecting" | "live" | "offline"
  >("idle");
  const [socketError, setSocketError] = useState<string | null>(null);
  const [highlightedMemberIds, setHighlightedMemberIds] = useState<string[]>([]);
  const socketRef = useRef<QueueUpClientSocket | null>(null);
  const highlightTimersRef = useRef<Map<string, number>>(new Map());

  const game = games.find((entry) => entry.id === lobby?.game) ?? null;
  const presentation = getGamePresentation(lobby?.game);
  const viewerMembership =
    lobby?.members.find((member) => member.userId === session?.id) ?? null;
  const host = lobby?.members.find((member) => member.role === "HOST") ?? null;
  const availableSeats = lobby
    ? Math.max(lobby.maxPlayers - lobby.members.length, 0)
    : 0;
  const isHost = viewerMembership?.role === "HOST";
  const canSubscribeToRoom = Boolean(
    session?.sessionToken && viewerMembership && lobby?.isActive
  );
  const canSendMessages = Boolean(
    viewerMembership && lobby?.isActive && connectionState === "live"
  );
  const chatStatusLabel = !viewerMembership
    ? "Read-only"
    : !lobby?.isActive
      ? "Closed"
      : connectionState === "live"
        ? "Live chat"
        : connectionState === "connecting"
          ? "Connecting"
          : "Reconnecting";
  const inviteUrl =
    typeof window === "undefined"
      ? ""
      : `${window.location.origin}/join?code=${normalizedCode}`;

  useEffect(() => {
    const timers = highlightTimersRef.current;

    return () => {
      for (const timer of timers.values()) {
        window.clearTimeout(timer);
      }
      timers.clear();
    };
  }, []);

  const flashMember = useEffectEvent((userId: string) => {
    const existingTimer = highlightTimersRef.current.get(userId);
    if (existingTimer) {
      window.clearTimeout(existingTimer);
    }

    setHighlightedMemberIds((current) =>
      current.includes(userId) ? current : [...current, userId]
    );

    const timer = window.setTimeout(() => {
      setHighlightedMemberIds((current) =>
        current.filter((entry) => entry !== userId)
      );
      highlightTimersRef.current.delete(userId);
    }, 1800);

    highlightTimersRef.current.set(userId, timer);
  });

  function appendMessage(message: Message) {
    setMessages((current) =>
      current.some((entry) => entry.id === message.id)
        ? current
        : [...current, message]
    );
  }

  function appendSystemMessage(
    content: string,
    tone: ChatSystemMessage["tone"] = "info"
  ) {
    setSystemMessages((current) => [
      ...current,
      createSystemMessage(content, tone),
    ]);
  }

  const handleLobbyUpdated = useEffectEvent((nextLobby: Lobby) => {
    const previousHostId =
      lobby?.members.find((member) => member.role === "HOST")?.userId ?? null;
    const nextHost =
      nextLobby.members.find((member) => member.role === "HOST") ?? null;

    setLobby(nextLobby);

    if (!nextLobby.isActive) {
      setBanner({
        tone: "info",
        title: "Lobby closed",
        message:
          "This room is no longer accepting joins. You can still review the final roster and recent chat.",
      });
    }

    if (nextHost && previousHostId && nextHost.userId !== previousHostId) {
      flashMember(nextHost.userId);
      appendSystemMessage(`${nextHost.user.username} is now hosting the lobby.`);
      setBanner({
        tone: "info",
        title: "Host updated",
        message:
          nextHost.userId === session?.id
            ? "Host ownership transferred to you."
            : `${nextHost.user.username} is now hosting the room.`,
      });
    }
  });

  const handleMemberJoined = useEffectEvent(
    (payload: { lobbyCode: string; member: Lobby["members"][number] }) => {
      if (payload.lobbyCode !== normalizedCode) {
        return;
      }

      flashMember(payload.member.userId);
      appendSystemMessage(
        `${payload.member.user.username} joined the lobby.`,
        payload.member.userId === session?.id ? "success" : "info"
      );

      if (payload.member.userId !== session?.id) {
        setBanner({
          tone: "info",
          title: "Roster update",
          message: `${payload.member.user.username} joined the lobby.`,
        });
      }
    }
  );

  const handleMemberLeft = useEffectEvent(
    (payload: {
      lobbyCode: string;
      userId: string;
      newHostId: string | null;
      lobbyClosed: boolean;
    }) => {
      if (payload.lobbyCode !== normalizedCode) {
        return;
      }

      const departingMember =
        lobby?.members.find((member) => member.userId === payload.userId) ?? null;
      const nextHost =
        lobby?.members.find((member) => member.userId === payload.newHostId) ?? null;

      if (payload.lobbyClosed) {
        appendSystemMessage(
          "The lobby closed after the final member left.",
          "info"
        );
        setBanner({
          tone: "info",
          title: "Lobby closed",
          message: "The final member left, so the room has been closed.",
        });
        return;
      }

      if (payload.newHostId) {
        flashMember(payload.newHostId);
      }

      appendSystemMessage(
        departingMember
          ? `${departingMember.user.username} left the lobby.`
          : "A player left the lobby."
      );

      setBanner({
        tone: "info",
        title: "Roster update",
        message: departingMember
          ? nextHost
            ? `${departingMember.user.username} left. ${nextHost.user.username} is now hosting.`
            : `${departingMember.user.username} left the lobby.`
          : "The lobby roster changed.",
      });
    }
  );

  const handleLobbyClosed = useEffectEvent((payload: { lobbyCode: string }) => {
    if (payload.lobbyCode !== normalizedCode) {
      return;
    }

    setLobby((current) => (current ? { ...current, isActive: false } : current));
    appendSystemMessage("The host closed this lobby.", "info");
    setBanner({
      tone: "info",
      title: "Lobby closed",
      message:
        "The host closed this room. You can head back to browse or create the next lobby.",
    });
  });

  const handleLobbyKicked = useEffectEvent(
    (payload: {
      lobbyCode: string;
      kickedUserId: string;
      kickedByUserId: string;
      kickedByUsername: string;
    }) => {
      if (payload.lobbyCode !== normalizedCode || payload.kickedUserId !== session?.id) {
        return;
      }

      setLobby((current) =>
        current
          ? {
              ...current,
              members: current.members.filter(
                (member) => member.userId !== payload.kickedUserId
              ),
            }
          : current
      );
      setConnectionState("idle");
      setSocketError(null);
      appendSystemMessage(
        `${payload.kickedByUsername} removed you from this lobby.`,
        "error"
      );
      setBanner({
        tone: "info",
        title: "Removed from lobby",
        message: `${payload.kickedByUsername} removed you from this room. You can still inspect it, but your seat is gone.`,
      });
    }
  );

  const handleChatMessage = useEffectEvent((payload: { message: Message }) => {
    appendMessage(payload.message);
  });

  useEffect(() => {
    let isCancelled = false;

    async function loadLobbyRoom() {
      if (!normalizedCode) {
        if (!isCancelled) {
          setError("Missing lobby code.");
          setIsLoading(false);
        }
        return;
      }

      setSystemMessages([]);
      setChatError(null);

      try {
        const [lobbyData, messageData] = await Promise.all([
          getLobby(normalizedCode),
          getLobbyMessages(normalizedCode),
        ]);

        if (isCancelled) {
          return;
        }

        setLobby(lobbyData);
        setMessages(messageData.data);
        setJoinRank((current) => current || lobbyData.rankFilter || "");
        setError(null);

        if (!lobbyData.isActive) {
          setBanner((current) =>
            current ?? {
              tone: "info",
              title: "Lobby closed",
              message:
                "This room has already been closed. You can still inspect the roster and last activity.",
            }
          );
        }
      } catch (loadError) {
        if (!isCancelled) {
          setError(getRoomErrorMessage(loadError));
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadLobbyRoom();

    return () => {
      isCancelled = true;
    };
  }, [normalizedCode]);

  useEffect(() => {
    if (!session?.sessionToken || !canSubscribeToRoom) {
      return;
    }

    const socket = createLobbySocket(session.sessionToken);
    socketRef.current = socket;

    function disconnectSocket(activeSocket: QueueUpClientSocket) {
      if (activeSocket.connected) {
        activeSocket.emit("lobby:leave", { lobbyCode: normalizedCode }, () => {
          activeSocket.disconnect();
        });

        window.setTimeout(() => {
          if (activeSocket.connected) {
            activeSocket.disconnect();
          }
        }, 150);
      } else {
        activeSocket.disconnect();
      }
    }

    socket.on("connect", () => {
      setConnectionState("connecting");
      setSocketError(null);

      socket.emit("lobby:join", { lobbyCode: normalizedCode }, (response) => {
        if (!response.ok) {
          setConnectionState("offline");
          setSocketError(response.error.message);
          return;
        }

        setLobby(response.data.lobby);
        setConnectionState("live");
      });
    });

    socket.on("disconnect", () => {
      setConnectionState((current) => (current === "idle" ? current : "offline"));
    });

    socket.on("connect_error", (connectError) => {
      setConnectionState("offline");
      setSocketError(
        connectError.message || "Could not connect to the live lobby room."
      );
    });

    socket.on("lobby:updated", ({ lobby: nextLobby }) => {
      handleLobbyUpdated(nextLobby);
    });
    socket.on("lobby:member-joined", handleMemberJoined);
    socket.on("lobby:member-left", handleMemberLeft);
    socket.on("lobby:closed", handleLobbyClosed);
    socket.on("lobby:kicked", handleLobbyKicked);
    socket.on("chat:new-message", handleChatMessage);

    socket.connect();

    return () => {
      socket.removeAllListeners();
      if (socketRef.current === socket) {
        socketRef.current = null;
      }
      disconnectSocket(socket);
    };
  }, [
    canSubscribeToRoom,
    lobby?.isActive,
    normalizedCode,
    session?.sessionToken,
  ]);

  async function handleSendMessage(content: string) {
    if (!lobby || !viewerMembership || !lobby.isActive) {
      setChatError("Chat is read-only for this lobby.");
      return false;
    }

    const socket = socketRef.current;
    if (!socket?.connected || connectionState !== "live") {
      setChatError("Live chat is reconnecting. Try again in a moment.");
      return false;
    }

    try {
      setIsSendingMessage(true);
      setChatError(null);

      const response = await new Promise<ChatAckResponse>((resolve) => {
        socket.emit(
          "chat:message",
          { lobbyCode: lobby.code, content },
          (ackResponse) => resolve(ackResponse)
        );
      });

      if (!response.ok) {
        setChatError(response.error.message);
        return false;
      }

      appendMessage(response.data.message);
      return true;
    } catch (sendError) {
      setChatError(
        sendError instanceof Error
          ? sendError.message
          : "Could not send this message."
      );
      return false;
    } finally {
      setIsSendingMessage(false);
    }
  }

  async function handleJoin() {
    if (!session || !lobby) {
      return;
    }

    try {
      setIsJoining(true);
      setJoinError(null);

      const joinedLobby = await joinLobby(
        lobby.code,
        joinRank || null,
        session.sessionToken
      );

      setLobby(joinedLobby);
      appendSystemMessage("You joined the lobby.", "success");
      setBanner({
        tone: "success",
        title: "Joined",
        message: `You joined ${joinedLobby.code}. Your seat is locked in.`,
      });
    } catch (joinAttemptError) {
      if (
        joinAttemptError instanceof ApiError &&
        typeof joinAttemptError.details?.activeLobbyCode === "string"
      ) {
        setJoinError(
          `${joinAttemptError.message} Active room: ${joinAttemptError.details.activeLobbyCode}.`
        );
      } else {
        setJoinError(getRoomErrorMessage(joinAttemptError));
      }
    } finally {
      setIsJoining(false);
    }
  }

  async function handleLeaveLobby() {
    if (!session || !lobby) {
      return;
    }

    const shouldLeave = window.confirm(
      "Leave this lobby and release your spot?"
    );

    if (!shouldLeave) {
      return;
    }

    try {
      setIsLeaving(true);
      await leaveLobbyRequest(lobby.code, session.sessionToken);

      startTransition(() => {
        navigate("/browse");
      });
    } catch (leaveError) {
      setBanner({
        tone: "error",
        title: "Leave failed",
        message: getRoomErrorMessage(leaveError),
      });
    } finally {
      setIsLeaving(false);
    }
  }

  async function handleCloseLobby() {
    if (!session || !lobby) {
      return;
    }

    const shouldClose = window.confirm(
      "Close this lobby for everyone? Members will stop receiving live room updates."
    );

    if (!shouldClose) {
      return;
    }

    try {
      setIsClosing(true);
      await closeLobbyRequest(lobby.code, session.sessionToken);
      setLobby((current) => (current ? { ...current, isActive: false } : current));
      appendSystemMessage("You closed the lobby.", "success");
      setBanner({
        tone: "success",
        title: "Lobby closed",
        message: "This room has been closed and is no longer accepting joins.",
      });
    } catch (closeError) {
      setBanner({
        tone: "error",
        title: "Close failed",
        message: getRoomErrorMessage(closeError),
      });
    } finally {
      setIsClosing(false);
    }
  }

  async function handleKickMember(userId: string, username: string) {
    if (!session || !lobby) {
      return;
    }

    const shouldKick = window.confirm(
      `Remove ${username} from this lobby?`
    );

    if (!shouldKick) {
      return;
    }

    try {
      setKickingUserId(userId);
      await kickLobbyMemberRequest(lobby.code, userId, session.sessionToken);
      setBanner({
        tone: "success",
        title: "Member removed",
        message: `${username} was removed from the lobby.`,
      });
    } catch (kickError) {
      setBanner({
        tone: "error",
        title: "Kick failed",
        message: getRoomErrorMessage(kickError),
      });
    } finally {
      setKickingUserId(null);
    }
  }

  async function handleCopyValue(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value);
      setBanner({
        tone: "success",
        title: `${label} copied`,
        message:
          label === "Invite"
            ? "The shareable room link is on your clipboard."
            : "The lobby code is on your clipboard.",
      });
    } catch {
      setBanner({
        tone: "error",
        title: "Copy failed",
        message: `Could not copy the ${label.toLowerCase()} from this browser session.`,
      });
    }
  }

  async function handleShareInvite() {
    if (!lobby) {
      return;
    }

    if (navigator.share) {
      try {
        await navigator.share({
          title: `QueueUp lobby ${lobby.code}`,
          text: `Join ${lobby.title} on QueueUp.`,
          url: inviteUrl,
        });
        return;
      } catch {
        // Fall through to clipboard copy when share is cancelled or unavailable.
      }
    }

    await handleCopyValue(inviteUrl, "Invite");
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="hero-shell h-[360px] animate-pulse bg-white/4" />
        <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
          <div className="glass-panel h-[320px] animate-pulse bg-white/4" />
          <div className="glass-panel h-[320px] animate-pulse bg-white/4" />
        </div>
      </div>
    );
  }

  if (error || !lobby) {
    return (
      <div className="mx-auto max-w-3xl space-y-5">
        <StatusBanner
          tone="error"
          title="Lobby unavailable"
          message={error ?? "This lobby could not be found."}
        />
        <div className="flex flex-wrap gap-3">
          <Link className="button-primary" to="/browse">
            Browse lobbies
          </Link>
          <Link className="button-secondary" to="/join">
            Join by code
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
      <section className="space-y-6">
        <article
          className={`hero-shell relative overflow-hidden p-6 sm:p-8 ${presentation.heroBackgroundClass}`}
        >
          <div className="absolute inset-x-[14%] top-14 h-[54%] rounded-[30px] border border-white/10 bg-[radial-gradient(circle_at_34%_28%,rgba(158,232,232,0.22),transparent_18%),radial-gradient(circle_at_80%_60%,rgba(255,181,159,0.18),transparent_24%),linear-gradient(160deg,rgba(7,16,20,0.94),rgba(12,18,24,0.84)_46%,rgba(28,17,14,0.92))]" />
          <div className="relative">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap gap-2">
                  <span className={`status-chip ${presentation.accentBorderClass}`}>
                    {game?.name ?? formatGameId(lobby.game)}
                  </span>
                  <span className="status-chip">{formatVisibility(lobby.visibility)}</span>
                  <span className="status-chip">
                    {lobby.members.length}/{lobby.maxPlayers} players
                  </span>
                  <span
                    className={`status-chip ${
                      connectionState === "live"
                        ? "border-[#9ee8e8]/18 bg-[#0f3b3b]/24 text-[#d9fffe]"
                        : connectionState === "connecting"
                          ? "border-white/18 bg-white/6 text-white/78"
                          : "border-[#ffb59f]/20 bg-[#802a0d]/16 text-[#fff6ee]"
                    }`}
                  >
                    {viewerMembership
                      ? connectionState === "live"
                        ? "Live sync"
                        : connectionState === "connecting"
                          ? "Syncing"
                          : "Offline sync"
                      : lobby.isActive
                        ? "Inspect mode"
                        : "Closed room"}
                  </span>
                </div>
                <h1 className="font-display mt-5 max-w-3xl text-4xl leading-none text-white sm:text-5xl">
                  {lobby.title}
                </h1>
                <p className="mt-4 max-w-2xl text-base leading-7 text-white/68">
                  {host ? `${host.user.username} is anchoring this room.` : "Host ready."}{" "}
                  {lobby.rankFilter
                    ? `Entry is tuned for ${formatRank(lobby.rankFilter)} and above.`
                    : "Entry is open-rank, with the roster and lobby state visible before anyone commits."}
                </p>
              </div>

              <div className="rounded-[26px] border border-white/12 bg-[rgba(20,19,18,0.8)] px-5 py-4 text-right backdrop-blur-xl">
                <p className="font-caps text-[10px] uppercase tracking-[0.3em] text-white/42">
                  Code
                </p>
                <p className="mt-2 text-xl font-semibold tracking-[0.32em] text-white">
                  {lobby.code}
                </p>
              </div>
            </div>

            {banner ? (
              <div className="mt-6">
                <StatusBanner
                  tone={banner.tone}
                  title={banner.title}
                  message={banner.message}
                />
              </div>
            ) : null}

            {socketError && viewerMembership && lobby.isActive ? (
              <div className="mt-4">
                <StatusBanner
                  tone="error"
                  title="Live link paused"
                  message={socketError}
                />
              </div>
            ) : null}

            <div className="mt-8 grid gap-4 md:grid-cols-4">
              <div className="glass-panel-soft p-4">
                <p className="font-caps text-[10px] uppercase tracking-[0.24em] text-white/42">
                  Minimum rank
                </p>
                <p className="mt-2 text-lg text-white">{formatRank(lobby.rankFilter)}</p>
              </div>
              <div className="glass-panel-soft p-4">
                <p className="font-caps text-[10px] uppercase tracking-[0.24em] text-white/42">
                  Opened
                </p>
                <p className="mt-2 text-lg text-white">
                  {formatRelativeTime(lobby.createdAt)}
                </p>
              </div>
              <div className="glass-panel-soft p-4">
                <p className="font-caps text-[10px] uppercase tracking-[0.24em] text-white/42">
                  Host
                </p>
                <p className="mt-2 text-lg text-white">
                  {host?.user.username ?? "Unknown"}
                </p>
              </div>
              <div className="glass-panel-soft p-4">
                <p className="font-caps text-[10px] uppercase tracking-[0.24em] text-white/42">
                  Status
                </p>
                <p className="mt-2 text-lg text-white">
                  {lobby.isActive ? `${availableSeats} seats open` : "Lobby closed"}
                </p>
              </div>
            </div>
          </div>
        </article>

        <section className="glass-panel p-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Current roster</p>
              <h2 className="font-display mt-3 text-3xl text-white">
                Everyone in the room
              </h2>
            </div>
            <span className="font-caps text-[11px] uppercase text-white/42">
              {lobby.members.length}/{lobby.maxPlayers}
            </span>
          </div>

          <div className="mt-5 space-y-3">
            {lobby.members.map((member) => (
              <div
                className={`member-card glass-panel-soft flex flex-wrap items-center justify-between gap-4 px-4 py-4 ${
                  highlightedMemberIds.includes(member.userId)
                    ? "member-card-live"
                    : ""
                }`}
                key={member.id}
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-[14px] border border-white/10 bg-[#2b2a28] font-caps text-[11px] uppercase text-white">
                    {getInitials(member.user.username)}
                  </div>
                  <div>
                    <p className="font-semibold text-white">
                      {member.user.username}
                      {member.userId === session?.id ? " (You)" : ""}
                    </p>
                    <p className="text-sm text-white/60">
                      {member.rank ? formatRank(member.rank) : "Rank hidden"}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {member.role === "HOST" ? (
                    <span className="status-chip border-[#ffb59f]/20 bg-[#802a0d]/16 text-[#fff6ee]">
                      Host
                    </span>
                  ) : (
                    <span className="status-chip">Member</span>
                  )}
                  <span className="status-chip">
                    {formatRelativeTime(member.joinedAt)}
                  </span>
                  {isHost &&
                  member.role !== "HOST" &&
                  member.userId !== session?.id &&
                  lobby.isActive ? (
                    <button
                      className="button-ghost"
                      disabled={kickingUserId === member.userId}
                      onClick={() =>
                        void handleKickMember(member.userId, member.user.username)
                      }
                      type="button"
                    >
                      {kickingUserId === member.userId ? "Removing..." : "Remove"}
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </section>

        <LobbyChat
          canSend={canSendMessages}
          currentUserId={session?.id}
          isSending={isSendingMessage}
          messages={messages}
          onSendMessage={handleSendMessage}
          sendError={chatError}
          statusLabel={chatStatusLabel}
          systemMessages={systemMessages}
        />
      </section>

      <aside className="space-y-6">
        {session ? (
          viewerMembership ? (
            <div className="glass-panel p-6">
              <p className="eyebrow">Room controls</p>
              <h2 className="font-display mt-3 text-3xl text-white">
                You&apos;re inside the lobby
              </h2>
              <p className="mt-3 text-sm leading-6 text-white/66">
                Share the invite, keep an eye on sync status, and manage your slot
                from here.
              </p>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="glass-panel-soft p-4">
                  <p className="font-caps text-[10px] uppercase tracking-[0.24em] text-white/42">
                    Your role
                  </p>
                  <p className="mt-2 text-lg text-white">
                    {viewerMembership.role === "HOST" ? "Host" : "Member"}
                  </p>
                </div>
                <div className="glass-panel-soft p-4">
                  <p className="font-caps text-[10px] uppercase tracking-[0.24em] text-white/42">
                    Your rank
                  </p>
                  <p className="mt-2 text-lg text-white">
                    {formatRank(viewerMembership.rank)}
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <button
                  className="button-secondary"
                  onClick={() => void handleCopyValue(lobby.code, "Code")}
                  type="button"
                >
                  Copy code
                </button>
                <button
                  className="button-secondary"
                  onClick={() => void handleCopyValue(inviteUrl, "Invite")}
                  type="button"
                >
                  Copy invite
                </button>
                <button
                  className="button-secondary sm:col-span-2"
                  onClick={() => void handleShareInvite()}
                  type="button"
                >
                  Share invite
                </button>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  className="button-ghost"
                  disabled={isLeaving}
                  onClick={() => void handleLeaveLobby()}
                  type="button"
                >
                  {isLeaving ? "Leaving..." : "Leave lobby"}
                </button>
                {isHost ? (
                  <button
                    className="button-primary"
                    disabled={isClosing || !lobby.isActive}
                    onClick={() => void handleCloseLobby()}
                    type="button"
                  >
                    {isClosing ? "Closing..." : "Close lobby"}
                  </button>
                ) : null}
              </div>

              {isHost && lobby.isActive ? (
                <p className="mt-4 text-sm leading-6 text-white/52">
                  Host controls let you close the room or remove individual members
                  directly from the roster.
                </p>
              ) : null}
            </div>
          ) : lobby.isActive ? (
            <div className="glass-panel p-6">
              <p className="eyebrow">Your access</p>
              <h2 className="font-display mt-3 text-3xl text-white">
                Join this lobby
              </h2>
              <p className="mt-2 text-sm leading-6 text-white/65">
                Pick your current rank for {game?.name ?? "this game"} and QueueUp
                will validate it against the room&apos;s published floor before you
                take the slot.
              </p>

              <label className="mt-5 block">
                <span className="mb-2 block font-caps text-[11px] uppercase tracking-[0.24em] text-white/54">
                  Your rank
                </span>
                <select
                  className="input-shell"
                  onChange={(event) => setJoinRank(event.target.value)}
                  value={joinRank}
                >
                  <option value="">Choose a rank</option>
                  {game?.ranks.map((rank) => (
                    <option key={rank} value={rank}>
                      {formatRank(rank)}
                    </option>
                  ))}
                </select>
              </label>

              <button
                className="button-primary mt-5 w-full"
                disabled={isJoining || !lobby.isActive}
                onClick={() => void handleJoin()}
                type="button"
              >
                {isJoining ? "Joining lobby..." : "Join lobby"}
              </button>

              {joinError ? (
                <div className="mt-4">
                  <StatusBanner
                    tone="error"
                    title="Join blocked"
                    message={joinError}
                  />
                </div>
              ) : null}
            </div>
          ) : (
            <div className="glass-panel p-6">
              <StatusBanner
                tone="info"
                title="Lobby closed"
                message="This room is no longer open for new members."
              />
              <div className="mt-5">
                <Link className="button-primary" to="/browse">
                  Browse active lobbies
                </Link>
              </div>
            </div>
          )
        ) : (
          <SessionPanel
            title="Launch your callsign to take the slot"
            description="Browsing stays open, but joining the roster still needs an active callsign so the host can see exactly who entered."
          />
        )}

      </aside>
    </div>
  );
}
