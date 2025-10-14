import checkConnectDB from "./DB/connectionDB.js";
import { globalErrorHandling } from "./middleware/globalErrorHandling.js";
import userRoter from "./modules/users/user.controller.js";
import cors from "cors";
import messageRouter from "./modules/users/message/message.controller.js";
import morgan from "morgan";
import chalk from "chalk";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";
import path from "path";

const bootstrap = async (app, express) => {
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
  // Parse URL-encoded bodies (for form submissions)
  app.use(express.urlencoded({ extended: true }));

  /**
   * @swagger
   * /:
   *   get:
   *     summary: Welcome endpoint
   *     description: Returns the API welcome page with links to documentation
   *     tags: [General]
   *     responses:
   *       200:
   *         description: Welcome page with API information
   *         content:
   *           text/html:
   *             schema:
   *               type: string
   */
  app.get("/", (req, res) => res.sendFile("index.html", { root: "public" }));
  // ================= Swagger Configuration =================
  const swaggerOptions = {
    definition: {
      openapi: "3.0.0",
      info: {
        title: "Saraha App API Documentation",
        version: "1.0.0",
        description:
          "API documentation for Saraha App - Anonymous messaging platform built with Node.js and Express",
        contact: {
          name: "API Support",
          email: "support@sarahaapp.com",
        },
      },
      servers: [
        {
          url: `http://localhost:${process.env.PORT || 5000}`,
          description: "Development server",
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
          },
        },
      },
      security: [
        {
          bearerAuth: [],
        },
      ],
    },
    apis: ["./src/modules/**/*.js", "./src/app.controller.js"],
  };

  const swaggerSpec = swaggerJsdoc(swaggerOptions);
  app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      customCss: ".swagger-ui .topbar { display: none }",
      customSiteTitle: "Saraha App API Documentation",
    })
  );
  // ==========================================================

  checkConnectDB();
  app.use("/uploads", express.static("uploads"));
  app.use(express.static("public"));
  app.use("/users", userRoter);
  app.use("/message", messageRouter);

  // Use a different approach for catch-all route
  app.use((req, res, next) => {
    throw new Error(`Url not found ${req.originalUrl}`, { cause: 404 });
  });

  app.use(globalErrorHandling);
};
export default bootstrap;
