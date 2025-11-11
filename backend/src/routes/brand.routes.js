import express from "express"
import {
  getAllBrands,
  getBrandById,
  createBrand,
  updateBrand,
  deleteBrand,
  assignUserToBrand,
  removeUserFromBrand,
} from "../controllers/brand.controller.js"
import { authenticate, authorize } from "../middleware/auth.middleware.js"

const router = express.Router()

router.use(authenticate)

router.get("/", getAllBrands)
router.get("/:id", getBrandById)
router.post("/", authorize("SUPER_ADMIN", "ADMIN"), createBrand)
router.put("/:id", authorize("SUPER_ADMIN", "ADMIN"), updateBrand)
router.delete("/:id", authorize("SUPER_ADMIN", "ADMIN"), deleteBrand)
router.post("/:id/users", authorize("SUPER_ADMIN", "ADMIN"), assignUserToBrand)
router.delete("/:id/users/:userId", authorize("SUPER_ADMIN", "ADMIN"), removeUserFromBrand)

export default router
