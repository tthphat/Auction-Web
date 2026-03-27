import express from "express";
import { isAuthenticated } from "../middlewares/auth.mdw.js";
import { productPublicController } from "../container.js";
import { upload } from "../config/multer.config.js";

const router = express.Router();

router.get("/category", productPublicController.getCategory);
router.get("/search", productPublicController.getSearch);
router.get("/detail", productPublicController.getDetail);

router.get(
  "/bidding-history",
  isAuthenticated,
  productPublicController.getBiddingHistory,
);

router.post(
  "/watchlist",
  isAuthenticated,
  productPublicController.postWatchlist,
);
router.delete(
  "/watchlist",
  isAuthenticated,
  productPublicController.deleteWatchlist,
);

router.post("/bid", isAuthenticated, productPublicController.postBid);
router.post("/comment", isAuthenticated, productPublicController.postComment);
router.get("/bid-history/:productId", productPublicController.getBidHistory);

router.get(
  "/complete-order",
  isAuthenticated,
  productPublicController.getCompleteOrder,
);

router.post(
  "/order/upload-images",
  isAuthenticated,
  upload.array("payment_proofs", 5),
  productPublicController.postOrderUploadImages,
);

router.post(
  "/order/:orderId/submit-payment",
  isAuthenticated,
  productPublicController.postOrderSubmitPayment,
);
router.post(
  "/order/:orderId/confirm-payment",
  isAuthenticated,
  productPublicController.postOrderConfirmPayment,
);
router.post(
  "/order/:orderId/submit-shipping",
  isAuthenticated,
  productPublicController.postOrderSubmitShipping,
);
router.post(
  "/order/:orderId/confirm-delivery",
  isAuthenticated,
  productPublicController.postOrderConfirmDelivery,
);
router.post(
  "/order/:orderId/submit-rating",
  isAuthenticated,
  productPublicController.postOrderSubmitRating,
);
router.post(
  "/order/:orderId/complete-skip",
  isAuthenticated,
  productPublicController.postOrderCompleteSkip,
);
router.post(
  "/order/:orderId/send-message",
  isAuthenticated,
  productPublicController.postOrderSendMessage,
);
router.get(
  "/order/:orderId/messages",
  isAuthenticated,
  productPublicController.getOrderMessages,
);

router.post(
  "/reject-bidder",
  isAuthenticated,
  productPublicController.postRejectBidder,
);
router.post(
  "/unreject-bidder",
  isAuthenticated,
  productPublicController.postUnrejectBidder,
);
router.post("/buy-now", isAuthenticated, productPublicController.postBuyNow);

router.get(
  "/seller/:sellerId/ratings",
  productPublicController.getSellerRatings,
);
router.get(
  "/bidder/:bidderId/ratings",
  productPublicController.getBidderRatings,
);

export default router;
