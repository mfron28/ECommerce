import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { userDto } from "../utils/userDto.js";
import { parseBody } from "../utils/parseBody.js";
import {
  changePasswordSchema,
  requestEmailSchema,
} from "../validation/profile.js";
import {
  changePassword,
  requestEmailChange,
} from "../services/profileService.js";

const router = Router();
router.use(requireAuth);

router.get("/", async (req, res) => {
  res.json({ status: "ok", user: userDto(req.user) });
});

router.patch("/password", async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = parseBody(
      changePasswordSchema,
      req.body
    );
    await changePassword(req.user._id, currentPassword, newPassword);
    res.json({ status: "ok", message: "Password updated" });
  } catch (e) {
    next(e);
  }
});

router.post("/request-email-change", async (req, res, next) => {
  try {
    const { newEmail } = parseBody(requestEmailSchema, req.body);
    const result = await requestEmailChange(req.user._id, newEmail);
    res.json({ status: "ok", ...result });
  } catch (e) {
    next(e);
  }
});

export default router;
