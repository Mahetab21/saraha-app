import path from "path";
import dotenv from "dotenv";
dotenv.config({ path: path.resolve("src/config/.env") });
import express from "express";
import bootstrab from "./src/app.controller.js";
import "./src/jobs/deleteExpiredTokens.js";
import "./src/utils/EmailEvents/index.js";
const app = express();
const port = process.env.PORT || 5000;
bootstrab(app, express);

app.listen(port, () => console.log(`Example app listening on port ${port}!`));
