import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  addToWishlist,
  getWishlist,
  removeFromWishlist,
} from "../services/wishlistService.js";

const router = Router();
router.use(requireAuth);

router.get("/", async (req, res, next) => {
  try {
    const data = await getWishlist(req.user._id);
    res.json({ status: "ok", ...data });
  } catch (e) {
    next(e);
  }
});

router.post("/:productId", async (req, res, next) => {
  try {
    const data = await addToWishlist(req.user._id, req.params.productId);
    res.status(201).json({ status: "ok", ...data });
  } catch (e) {
    next(e);
  }
});

router.delete("/:productId", async (req, res, next) => {
  try {
    const data = await removeFromWishlist(req.user._id, req.params.productId);
    res.json({ status: "ok", ...data });
  } catch (e) {
    next(e);
  }
});

export default router;
