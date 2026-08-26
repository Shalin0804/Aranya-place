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

import { requireAdminAuth } from "../middleware/auth.js";

const router = Router();

/* =========================================================
   ADMIN AUTHENTICATION
   All routes below require admin authentication
========================================================= */

router.use(requireAdminAuth);

/* =========================================================
   ROOM TYPES
========================================================= */

// Get all room types
router.get("/room-types", getRoomTypesForAdmin);

// Create a room type
router.post("/room-types", createRoomType);

// Update a room type
router.put("/room-types/:id", updateRoomType);

// Delete a room type
router.delete("/room-types/:id", deleteRoomType);

/* =========================================================
   PHYSICAL ROOMS
========================================================= */

// Get all rooms
router.get("/", getAdminRooms);

// Get single room by ID
router.get("/:id", getAdminRoomById);

// Create new room
router.post("/", createRoom);

// Update complete room
router.put("/:id", updateRoom);

// Update room status
router.put("/:id/status", updateRoomStatus);

// Delete room
router.delete("/:id", deleteRoom);

export default router;