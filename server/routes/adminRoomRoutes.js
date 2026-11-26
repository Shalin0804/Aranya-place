import { Router } from "express";

import {
  getAdminRooms,
  getAdminRoomById,
  createRoom,
  updateRoom,
  updateRoomStatus,
  deleteRoom,
  getRoomTypesForAdmin,
  createRoomType,
  updateRoomType,
  deleteRoomType,
} from "../controllers/adminRoomController.js";

import { requireAdminAuth, requirePermission } from "../middleware/auth.js";

const router = Router();

router.use(requireAdminAuth);

const view = requirePermission("rooms.view");
const manage = requirePermission("rooms.manage");

/* ROOM TYPES */
router.get("/room-types", view, getRoomTypesForAdmin);
router.post("/room-types", manage, createRoomType);
router.put("/room-types/:id", manage, updateRoomType);
router.delete("/room-types/:id", manage, deleteRoomType);

/* PHYSICAL ROOMS */
router.get("/", view, getAdminRooms);
router.get("/:id", view, getAdminRoomById);
router.post("/", manage, createRoom);
router.put("/:id", manage, updateRoom);
router.put("/:id/status", requirePermission("rooms.status"), updateRoomStatus);
router.delete("/:id", manage, deleteRoom);

export default router;
