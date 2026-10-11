import { Router } from "express";
import { OrderController } from "./order.controller.js";
import { authenticate } from "../../shared/middlewares/auth.middleware.js";
import { validate } from "../../shared/middlewares/validator.middleware.js";
import { checkoutBodySchema } from "./order.schema.js";

const router = Router();

router.use(authenticate)

router.post(
  "/checkout",
  validate({ body: checkoutBodySchema }),
  OrderController.checkout
);

router.get("/", OrderController.getMyOrders);
router.get("/:id", OrderController.getOrderDetail);

export default router;