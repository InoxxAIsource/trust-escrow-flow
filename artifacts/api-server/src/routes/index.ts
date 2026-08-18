import { Router, type IRouter } from "express";
import healthRouter from "./health";
import notifyRouter from "./notify";
import monitorRouter from "./monitor";

const router: IRouter = Router();

router.use(healthRouter);
router.use(notifyRouter);
router.use(monitorRouter);

export default router;
