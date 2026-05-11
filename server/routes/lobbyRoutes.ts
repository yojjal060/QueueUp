import { Router } from "express";
import {
  createLobby,
  listLobbies,
  getLobby,
  joinLobby,
  leaveLobby,
  closeLobby,
  getMessages,
  getGames,
} from "../controllers/lobbyController.js";
import { requireSession } from "../middleware/session.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

// GET /api/games — List supported games + rank tiers (public)
router.get("/games", asyncHandler(getGames));

// GET /api/lobbies — List public lobbies (public)
router.get("/", asyncHandler(listLobbies));

// GET /api/lobbies/:code — Get lobby details (public)
router.get("/:code", asyncHandler(getLobby));

// GET /api/lobbies/:code/messages — Get chat messages (public for now)
router.get("/:code/messages", asyncHandler(getMessages));

// POST /api/lobbies — Create a lobby (session required)
router.post("/", requireSession, asyncHandler(createLobby));

// POST /api/lobbies/:code/join — Join a lobby (session required)
router.post("/:code/join", requireSession, asyncHandler(joinLobby));

// POST /api/lobbies/:code/leave — Leave a lobby (session required)
router.post("/:code/leave", requireSession, asyncHandler(leaveLobby));

// POST /api/lobbies/:code/close — Close a lobby (host only, session required)
router.post("/:code/close", requireSession, asyncHandler(closeLobby));

export default router;
