import express, { Request, Response } from "express";
import {checkDBHealth} from "./database/index";  
import httpLogger from "./config/httpLogger.config";

const app = express();

app.use(httpLogger);
app.use(express.json());
app.use(express.urlencoded({ extended: true, limit: "50kb" }));


app.use("/health", async (req: Request, res: Response) => {
  const db = await checkDBHealth();
  res.status(db.ok ? 200 : 503).json({
    status: db.ok ? "ok" : "error",
    database: db.ok ? "healthy" : `unhealthy - ${db.error}`,
  });
});

app.use("/", (req: Request, res: Response) => {
  res.json({ message: "Welcome to the Workout Tracker API!" });
});
export default app;
