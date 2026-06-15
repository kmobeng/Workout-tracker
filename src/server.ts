import app from "./app";
import dotenv from "dotenv";
import logger from "./config/winston.config";
dotenv.config();

const PORT = process.env.PORT;

const startServer = () => {
  try {
    app.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    logger.error("Error starting server:", error);
  }
};

startServer();