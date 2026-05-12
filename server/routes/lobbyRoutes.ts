import { Router } from "express";
import {
  closeLobby,
  createLobby,
  getGames,
  getLobby,
  getMessages,
  joinLobby,
  kickLobbyMember,
  leaveLobby,
  listLobbies,
} from "../controllers/lobbyController.js";
import { requireSession } from "../middleware/session.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.get("/games", asyncHandler(getGames));
router.get("/", asyncHandler(listLobbies));
router.get("/:code", asyncHandler(getLobby));
router.get("/:code/messages", asyncHandler(getMessages));

router.post("/", requireSession, asyncHandler(createLobby));
router.post("/:code/join", requireSession, asyncHandler(joinLobby));
router.post("/:code/leave", requireSession, asyncHandler(leaveLobby));
router.post("/:code/kick", requireSession, asyncHandler(kickLobbyMember));
router.post("/:code/close", requireSession, asyncHandler(closeLobby));

export default router;
