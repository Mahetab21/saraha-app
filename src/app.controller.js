import checkConnectDB from "./DB/connectionDB.js";
import { globalErrorHandling } from "./middleware/globalErrorHandling.js";
import userRoter from "./modules/users/user.controller.js";
import cors from "cors";
import messageRouter from "./modules/users/message/message.controller.js";
import morgan from "morgan";
import chalk from "chalk";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
const bootstrab = async (app, express) => {
  var whitelist = [process.env.FRONTEND_ORIGIN, undefined];
  var corsOptions = {
    origin: function (origin, callback) {
      if (whitelist.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
  };
  const limiter = rateLimit({
    windowMs: 60 * 1000,
    max: 5,
    handler: (req, res, next, options) => {
      res
        .status(429)
        .json({ message: "Too many requests, please try again later." });
    },
    //legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    skipSuccessfulRequests: true, // Don't count successful requests against the limit
    skipFailedRequests: false, // Count failed requests against the limit
  });
  app.use(cors(corsOptions));
  app.use(morgan("dev"));
  app.use(limiter);
  app.use(helmet());
  app.use(express.json());
  app.get("/", (req, res) => res.send("Hello World!"));

  checkConnectDB();
  app.use("/uploads", express.static("uploads"));
  app.use("/users", userRoter);
  app.use("/message", messageRouter);

  // Use a different approach for catch-all route
  app.use((req, res, next) => {
    throw new Error(`Url not found ${req.originalUrl}`, { cause: 404 });
  });

  app.use(globalErrorHandling);
};
export default bootstrab;
