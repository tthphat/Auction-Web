import express from "express";
import { sellerController } from "../container.js";
import { uploadBasic as upload } from "../config/multer.config.js";

const router = express.Router();

// Dashboard
router.get("/", sellerController.getDashboard);

// All Products - View only
router.get("/products", sellerController.getAllProducts);

// Active Products - CRUD
router.get("/products/active", sellerController.getActiveProducts);

// Pending Products - Waiting for payment
router.get("/products/pending", sellerController.getPendingProducts);

// Sold Products - Paid successfully
router.get("/products/sold", sellerController.getSoldProducts);

// Expired Products - No bidder or cancelled
router.get("/products/expired", sellerController.getExpiredProducts);

// Add Product Form
router.get("/products/add", sellerController.getAddProductForm);

// Add Product
router.post("/products/add", sellerController.addProduct);

// Upload Thumbnail
router.post(
  "/products/upload-thumbnail",
  upload.single("thumbnail"),
  sellerController.uploadThumbnail,
);

// Upload Subimages
router.post(
  "/products/upload-subimages",
  upload.array("images", 10),
  sellerController.uploadSubimages,
);

// Cancel Product
router.post("/products/:id/cancel", sellerController.cancelProduct);

// Rate Product / Bidder
router.post("/products/:id/rate", sellerController.rateProduct);

// Update Product Rating
router.put("/products/:id/rate", sellerController.updateProductRating);

// Append Description to Product
router.post(
  "/products/:id/append-description",
  sellerController.appendDescription,
);

// Get Description Updates for a Product
router.get(
  "/products/:id/description-updates",
  sellerController.getDescriptionUpdates,
);

// Update a Description Update
router.put(
  "/products/description-updates/:updateId",
  sellerController.updateDescription,
);

// Delete a Description Update
router.delete(
  "/products/description-updates/:updateId",
  sellerController.deleteDescription,
);

export default router;
