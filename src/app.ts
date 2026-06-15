import express, { Request, Response } from "express";
import morgan from "morgan";
import httpLogger from "./config/httpLogger.config";

const app = express();

app.use(httpLogger);
app.use(express.json());
app.use(express.urlencoded({ extended: true, limit: "50kb" }));

app.use("/", (req: Request, res: Response) => {
  res.send("Hello World");
});

export default app;
