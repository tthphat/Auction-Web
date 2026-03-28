import express from "express";
import passport from "../config/passport.js";
import { isAuthenticated } from "../middlewares/auth.mdw.js";
import { accountController } from "../container.js";

const router = express.Router();

router.get("/ratings", isAuthenticated, accountController.getRatings);

router.get("/signup", accountController.getSignup);
router.post("/signup", accountController.postSignup);

router.get("/signin", accountController.getSignin);
router.post("/signin", accountController.postSignin);

router.get("/verify-email", accountController.getVerifyEmail);
router.post("/verify-email", accountController.postVerifyEmail);
router.post("/resend-otp", accountController.postResendOtp);

router.get("/forgot-password", accountController.getForgotPassword);
router.post("/forgot-password", accountController.postForgotPassword);
router.post(
  "/verify-forgot-password-otp",
  accountController.postVerifyForgotPasswordOtp,
);
router.post(
  "/resend-forgot-password-otp",
  accountController.postResendForgotPasswordOtp,
);
router.post("/reset-password", accountController.postResetPassword);

router.get("/profile", isAuthenticated, accountController.getProfile);
router.put("/profile", isAuthenticated, accountController.putProfile);

router.post("/logout", isAuthenticated, accountController.postLogout);

router.get(
  "/request-upgrade",
  isAuthenticated,
  accountController.getRequestUpgrade,
);
router.post(
  "/request-upgrade",
  isAuthenticated,
  accountController.postRequestUpgrade,
);

router.get("/watchlist", isAuthenticated, accountController.getWatchlist);

router.get("/bidding", isAuthenticated, accountController.getBidding);
router.get("/auctions", isAuthenticated, accountController.getAuctions);

router.post(
  "/won-auctions/:productId/rate-seller",
  isAuthenticated,
  accountController.postRateSeller,
);
router.put(
  "/won-auctions/:productId/rate-seller",
  isAuthenticated,
  accountController.putRateSeller,
);

router.get(
  "/seller/products",
  isAuthenticated,
  accountController.getMyProducts,
);
router.get(
  "/seller/sold-products",
  isAuthenticated,
  accountController.getSoldProducts,
);

// ===================== OAUTH ROUTES =====================

// Google OAuth
router.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] }),
);

router.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/account/signin" }),
  (req, res) => {
    req.session.authUser = req.user;
    req.session.isAuthenticated = true;
    res.redirect("/");
  },
);

// Facebook OAuth
// NOTE: 'email' scope chỉ hoạt động với Admin/Developer/Tester trong Development Mode
// Tạm thời chỉ dùng 'public_profile' để test, sau đó thêm 'email' khi đã add tester
router.get(
  "/auth/facebook",
  passport.authenticate("facebook", { scope: ["public_profile"] }),
);

router.get(
  "/auth/facebook/callback",
  passport.authenticate("facebook", { failureRedirect: "/account/signin" }),
  (req, res) => {
    req.session.authUser = req.user;
    req.session.isAuthenticated = true;
    res.redirect("/");
  },
);

// Twitter OAuth - DISABLED (Twitter API requires $100/month subscription)
// router.get('/auth/twitter',
//   passport.authenticate('twitter')
// );

// router.get('/auth/twitter/callback',
//   passport.authenticate('twitter', { failureRedirect: '/account/signin' }),
//   (req, res) => {
//     req.session.authUser = req.user;
//     req.session.isAuthenticated = true;
//     res.redirect('/');
//   }
// );

// GitHub OAuth
router.get(
  "/auth/github",
  passport.authenticate("github", { scope: ["user:email"] }),
);

router.get(
  "/auth/github/callback",
  passport.authenticate("github", { failureRedirect: "/account/signin" }),
  (req, res) => {
    req.session.authUser = req.user;
    req.session.isAuthenticated = true;
    res.redirect("/");
  },
);

export default router;
