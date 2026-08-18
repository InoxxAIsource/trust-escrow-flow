import { Router, type Request, type Response } from "express";
import { getMonitorStatus } from "../lib/monitor.js";

const monitorRouter = Router();

/**
 * GET /api/monitor/status
 * Returns the current uptime-monitor state for all watched endpoints.
 * No auth required — useful for external health dashboards.
 */
monitorRouter.get("/monitor/status", (_req: Request, res: Response) => {
  const statuses = getMonitorStatus();
  const anyDown = statuses.some((s) => s.isDown);
  res.status(anyDown ? 503 : 200).json({
    ok: !anyDown,
    checkedAt: new Date().toISOString(),
    endpoints: statuses,
  });
});

export default monitorRouter;
