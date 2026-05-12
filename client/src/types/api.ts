export interface UserSession {
  id: string;
  username: string;
  sessionToken: string;
  avatar: string | null;
  createdAt?: string;
}

export interface GameConfig {
  id: string;
  name: string;
  shortName: string;
  icon: string;
  maxPlayers: number;
  ranks: string[];
}

export type GamesResponse = Record<string, GameConfig>;

export interface LobbyUser {
  id: string;
  username: string;
  avatar: string | null;
}

export interface LobbyMember {
  id: string;
  userId: string;
  lobbyId: string;
  role: "HOST" | "MEMBER";
  rank: string | null;
  joinedAt: string;
  user: LobbyUser;
}

export interface Lobby {
  id: string;
  code: string;
  title: string;
  game: string;
  visibility: "PUBLIC" | "PRIVATE";
  rankFilter: string | null;
  maxPlayers: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  members: LobbyMember[];
  _count?: {
    members: number;
  };
}

export interface Message {
  id: string;
  content: string;
  userId: string;
  lobbyId: string;
  createdAt: string;
  user: LobbyUser;
}

export interface PaginatedResponse<T> {
  success: true;
  data: T;
  nextCursor?: string | null;
}
