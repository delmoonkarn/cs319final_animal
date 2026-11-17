import { env } from "./lib/env";
import cors from "cors";
import express from "express";
import { prisma } from "./lib/prisma";
import { errorHandler, notFoundHandler } from "./middlewares/error-handler";
import { apiRouter } from "./routes";

const app = express();

app.disable("x-powered-by");
app.use(cors({ origin: env.CLIENT_ORIGINS }));
app.use(express.json());

app.use("/api", apiRouter);

app.use(notFoundHandler);
app.use(errorHandler);

const server = app.listen(env.PORT, (error) => {
  if (error) {
    console.error(`Could not start the server on port ${env.PORT}: ${error.message}`);
    process.exit(1);
  }
  console.log(`API listening on http://localhost:${env.PORT}/api (CORS origin: ${env.CLIENT_ORIGINS.join(", ")})`);
});

async function shutdown(signal: NodeJS.Signals): Promise<void> {
  console.log(`${signal} received, shutting down`);
  server.close();
  await prisma.$disconnect();
  process.exit(0);
}

process.once("SIGINT", (signal) => void shutdown(signal));
process.once("SIGTERM", (signal) => void shutdown(signal));
