// filepath: d:\sarahaApp\src\jobs\deleteExpiredTokens.js
import cron from "node-cron";
import revokeTokenModel from "../DB/models/revoke-token.model.js";

cron.schedule("0 * * * *", async () => {
  const now = Date.now();
  await revokeTokenModel.deleteMany({ expireAt: { $lte: now } });
  console.log("Old revoke tokens deleted successfully");
});