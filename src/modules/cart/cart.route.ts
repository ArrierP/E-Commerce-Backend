import { Router } from "express";
import { CartController } from "./cart.controller.js";
import { authenticate } from "../../shared/middlewares/auth.middleware.js";
import { validate } from "../../shared/middlewares/validator.middleware.js";
import {
  addToCartBodySchema,
  updateQuantityBodySchema,
} from "./cart.schema.js";



const router = Router()


router.use(authenticate)


router.get("/", CartController.getCart);

router.post(
  "/items",
  validate({ body: addToCartBodySchema }),
  CartController.addItem
);

router.patch(
  "/items/:productId",
  validate({ body: updateQuantityBodySchema }),
  CartController.updateQuantity
);

router.delete('/items/:productId', CartController.removeItem)

export default router