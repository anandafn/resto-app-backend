import express from "express";
import MyUserController from "../controllers/MyUserController";
import { jwtCheck, jwtParse } from "../middleware/auth";
import { validateMyUserRequest } from "../middleware/validation";

const router = express.Router();

// Get the user data
// /api/my/user
router.get("/", jwtCheck, jwtParse, MyUserController.getCurrentUser);

// Create the user
// /api/my/user
router.post("/", jwtCheck, MyUserController.createCurrentUser);

// update current user
router.put(
  "/",
  jwtCheck,
  jwtParse,
  validateMyUserRequest,
  MyUserController.updateCurrentUser
);

export default router;
