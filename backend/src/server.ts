import { app } from "./app";
import { env } from "./config/env";
import { closeOraclePool, initOraclePool } from "./db/oracle/pool";

const start = async (): Promise<void> => {
  await initOraclePool();

  app.listen(env.port, () => {
    console.log(`Backend running at http://localhost:${env.port}`);
  });
};

void start();

process.on("SIGINT", async () => {
  await closeOraclePool();
  process.exit(0);
});
