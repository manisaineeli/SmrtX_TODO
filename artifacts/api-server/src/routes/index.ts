import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import userRouter from "./user";
import tasksRouter from "./tasks";
import notesRouter from "./notes";
import pomodoroRouter from "./pomodoro";
import analyticsRouter from "./analytics";
import aiRouter from "./ai";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(userRouter);
router.use(tasksRouter);
router.use(notesRouter);
router.use(pomodoroRouter);
router.use(analyticsRouter);
router.use(aiRouter);

export default router;
