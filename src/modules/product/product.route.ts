import { Router } from "express";
import { ProductController } from "./product.controller.js";
import {
  productBodySchema,
  updateProductBodySchema,
  productQuerySchema,
} from "./product.schema.js";

import { validate } from "../../shared/middlewares/validator.middleware.js";
import { authenticate, requireAdmin } from "../../shared/middlewares/auth.middleware.js";

const router = Router();

// --- PUBLIC / CUSTOMER ROUTES ---
router.get(
  "/",
  validate({ query: productQuerySchema }),
  ProductController.getList
);

router.get("/:idOrSlug", ProductController.getDetail);

// --- ADMIN ROUTES (Protected) ---
router.use(authenticate, requireAdmin());

router.post(
  "/",
  validate({ body: productBodySchema }),
  ProductController.create
);

router.patch(
  "/:id",
  validate({ body: updateProductBodySchema }),
  ProductController.update
);

router.delete("/:id", ProductController.delete);

export default router;