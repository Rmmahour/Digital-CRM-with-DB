import express from "express"
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  updateUserStatus,
} from "../controllers/user.controller.js"
import { authenticate, authorize } from "../middleware/auth.middleware.js"

const router = express.Router()

router.use(authenticate)

router.get("/", getAllUsers)
router.get("/:id", getUserById)
router.post("/", authorize(["SUPER_ADMIN"]), createUser)
router.put("/:id", authorize(["SUPER_ADMIN", "ADMIN"]), updateUser)
router.put("/:id/status", authorize(["SUPER_ADMIN", "ADMIN"]), updateUserStatus)
router.delete("/:id", authorize(["SUPER_ADMIN"]), deleteUser)

export default router
