import { Router } from "express";
import * as MS from "./message.service.js";
import * as MV from "./message.validation.js";
import { validation } from "../../../middleware/validation.js";
import { authentication } from "../../../middleware/authentication.js";

/**
 * @swagger
 * components:
 *   schemas:
 *     Message:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Message ID
 *         content:
 *           type: string
 *           description: Message content
 *         receiverId:
 *           type: string
 *           description: ID of the user who received the message
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     CreateMessageRequest:
 *       type: object
 *       required:
 *         - content
 *         - receiverId
 *       properties:
 *         content:
 *           type: string
 *           description: The message content
 *           minLength: 1
 *           maxLength: 1000
 *         receiverId:
 *           type: string
 *           description: ID of the user to receive the message
 */

const messageRouter = Router({ caseSensitive: true });

/**
 * @swagger
 * /message/send:
 *   post:
 *     summary: Send an anonymous message
 *     tags: [Messages]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateMessageRequest'
 *     responses:
 *       201:
 *         description: Message sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Message'
 *       400:
 *         description: Validation error
 *       404:
 *         description: Receiver not found
 *       500:
 *         description: Internal server error
 */
messageRouter.post(
  "/send",
  validation(MV.createMessageScheme),
  MS.createMessage
);
/**
 * @swagger
 * /message/list:
 *   get:
 *     summary: Get all messages for authenticated user
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Messages retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 messages:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Message'
 *       401:
 *         description: Unauthorized - Invalid token
 *       500:
 *         description: Internal server error
 */
messageRouter.get("/list", authentication, MS.listMessages);
/**
 * @swagger
 * /message/{id}:
 *   get:
 *     summary: Get a specific message by ID
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Message ID
 *     responses:
 *       200:
 *         description: Message retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   $ref: '#/components/schemas/Message'
 *       401:
 *         description: Unauthorized - Invalid token
 *       403:
 *         description: Forbidden - Not your message
 *       404:
 *         description: Message not found
 *       500:
 *         description: Internal server error
 */
messageRouter.get(
  "/:id",
  validation(MV.getMessageScheme),
  authentication,
  MS.getMessage
);
/**
 * @swagger
 * /message/{id}:
 *   delete:
 *     summary: Delete a specific message by ID
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Message ID
 *     responses:
 *       200:
 *         description: Message deleted successfully
 *       401:
 *         description: Unauthorized - Invalid token
 *       403:
 *         description: Forbidden - Not your message
 *       404:
 *         description: Message not found
 *       500:
 *         description: Internal server error
 */
messageRouter.delete(
  "/:id",
  validation(MV.deleteMessageScheme),
  authentication,
  MS.deleteMessage
);
export default messageRouter;
