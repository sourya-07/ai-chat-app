import { Router } from "express";
import * as aiController from "../controllers/ai.controller.js";
// import router from "./user.routes";

const router = Router();

router.get('/get-result', aiController.getResult);


export default router;