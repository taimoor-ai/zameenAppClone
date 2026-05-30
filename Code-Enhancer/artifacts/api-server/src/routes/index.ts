import { Router, type IRouter } from "express";

import adminRouter from "./admin";
import authRouter from "./auth";
import healthRouter from "./health";
import messagesRouter from "./messages";
import propertiesRouter from "./properties";
import savedRouter from "./saved";
import storageRouter from "./storage";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(storageRouter);
router.use(propertiesRouter);
router.use(messagesRouter);
router.use(adminRouter);
router.use(savedRouter);

export default router;
