export function createAccountController({ accountService, accountRepository }) {
  return {
    getRatings: async (req, res) => {
      const currentUserId = req.session.authUser.id;
      const vm = await accountService.getRatingsPageData(currentUserId);
      return res.render("vwAccount/rating", vm);
    },

    getSignup: (req, res) => {
      return res.render("vwAccount/auth/signup", {
        recaptchaSiteKey: process.env.RECAPTCHA_SITE_KEY,
      });
    },

    getSignin: (req, res) => {
      const vm = accountService.getSigninViewData(req.session);
      return res.render("vwAccount/auth/signin", vm);
    },

    getVerifyEmail: (req, res) => {
      const vm = accountService.getVerifyEmailViewData(req.query.email);
      if (!vm) return res.redirect("/account/signin");
      return res.render("vwAccount/auth/verify-otp", vm);
    },

    getForgotPassword: (req, res) => {
      return res.render("vwAccount/auth/forgot-password");
    },

    postForgotPassword: async (req, res) => {
      const { email } = req.body;
      const result = await accountService.requestForgotPassword(email);
      return res.render(result.view, result.data);
    },

    postVerifyForgotPasswordOtp: async (req, res) => {
      const { email, otp } = req.body;
      const result = await accountService.verifyForgotPasswordOtp(email, otp);
      return res.render(result.view, result.data);
    },

    postResendForgotPasswordOtp: async (req, res) => {
      const { email } = req.body;
      const result = await accountService.resendForgotPasswordOtp(email);
      return res.render(result.view, result.data);
    },

    postResetPassword: async (req, res) => {
      const { email, new_password, confirm_new_password } = req.body;
      const result = await accountService.resetPassword(
        email,
        new_password,
        confirm_new_password,
      );
      return res.render(result.view, result.data);
    },

    postSignin: async (req, res) => {
      const { email, password } = req.body;
      const result = await accountService.signin(email, password, req.session);

      if (!result.ok && result.view) {
        return res.render(result.view, result.data);
      }

      return res.redirect(result.redirect);
    },

    postSignup: async (req, res) => {
      const { fullname, email, address, password, confirmPassword } = req.body;
      const recaptchaResponse = req.body["g-recaptcha-response"];

      const errors = {};
      const old = { fullname, email, address };

      if (!recaptchaResponse) {
        errors.captcha = "Please check the captcha box.";
      } else {
        const secretKey = process.env.RECAPTCHA_SECRET;
        const verifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${recaptchaResponse}`;

        try {
          const response = await fetch(verifyUrl, { method: "POST" });
          const data = await response.json();
          if (!data.success) {
            errors.captcha = "Captcha verification failed. Please try again.";
          }
        } catch (err) {
          console.error("Recaptcha error:", err);
          errors.captcha = "Error connecting to captcha server.";
        }
      }

      if (!fullname) errors.fullname = "Full name is required";
      if (!address) errors.address = "Address is required";
      if (!email) errors.email = "Email is required";
      if (!password) errors.password = "Password is required";
      if (password !== confirmPassword) {
        errors.confirmPassword = "Passwords do not match";
      }

      if (accountRepository?.findUserByEmail) {
        const isEmailExist = await accountRepository.findUserByEmail(email);
        if (isEmailExist) errors.email = "Email is already in use";
      }

      if (Object.keys(errors).length > 0) {
        return res.render("vwAccount/auth/signup", {
          errors,
          old,
          error_message: "Please correct the errors below.",
          recaptchaSiteKey: process.env.RECAPTCHA_SITE_KEY,
        });
      }

      const result = await accountService.signup({
        fullname,
        email,
        address,
        password,
      });
      return res.redirect(result.redirect);
    },

    postVerifyEmail: async (req, res) => {
      const { email, otp } = req.body;
      const result = await accountService.verifyEmail(email, otp, req.session);
      if (!result.ok) {
        return res.render(result.view, result.data);
      }
      return res.redirect(result.redirect);
    },

    postResendOtp: async (req, res) => {
      const { email } = req.body;
      const result = await accountService.resendVerifyOtp(email);
      return res.render(result.view, result.data);
    },

    getProfile: async (req, res) => {
      try {
        const currentUserId = req.session.authUser.id;
        const vm = await accountService.getProfilePageData(
          currentUserId,
          req.query,
        );
        return res.render("vwAccount/profile", vm);
      } catch (err) {
        console.error(err);
        return res.render("vwAccount/profile", {
          user: req.session.authUser,
          err_message: "Unable to load profile information.",
        });
      }
    },

    putProfile: async (req, res) => {
      try {
        const currentUserId = req.session.authUser.id;
        const result = await accountService.updateProfile(
          currentUserId,
          req.body,
        );

        if (!result.ok) {
          return res.render(result.view, result.data);
        }

        if (result.updatedUser) {
          req.session.authUser = result.updatedUser;
        }

        return res.redirect("/account/profile?success=true");
      } catch (err) {
        console.error(err);
        return res.render("vwAccount/profile", {
          user: req.session.authUser,
          err_message: "System error. Please try again later.",
        });
      }
    },

    postLogout: (req, res) => {
      req.session.isAuthenticated = false;
      delete req.session.authUser;
      return res.redirect("/");
    },

    getRequestUpgrade: async (req, res) => {
      const currentUserId = req.session.authUser.id;
      const vm = await accountService.getUpgradeRequestPageData(currentUserId);
      return res.render("vwAccount/request-upgrade", vm);
    },

    postRequestUpgrade: async (req, res) => {
      try {
        const currentUserId = req.session.authUser.id;
        await accountService.submitUpgradeRequest(currentUserId);
        return res.redirect("/account/profile?send-request-upgrade=true");
      } catch (err) {
        console.error(err);
        return res.render("vwAccount/profile", {
          user: req.session.authUser,
          err_message:
            "Unable to submit your request at this time. Please try again later.",
        });
      }
    },

    getWatchlist: async (req, res) => {
      const currentUserId = req.session.authUser.id;
      const vm = await accountService.getWatchlistPageData(
        currentUserId,
        req.query.page,
      );
      return res.render("vwAccount/watchlist", vm);
    },

    getBidding: async (req, res) => {
      const currentUserId = req.session.authUser.id;
      const vm = await accountService.getBiddingProductsPageData(currentUserId);
      return res.render("vwAccount/bidding-products", vm);
    },

    getAuctions: async (req, res) => {
      const currentUserId = req.session.authUser.id;
      const vm = await accountService.getWonAuctionsPageData(currentUserId);
      return res.render("vwAccount/won-auctions", vm);
    },

    postRateSeller: async (req, res) => {
      try {
        const currentUserId = req.session.authUser.id;
        const productId = req.params.productId;
        const { seller_id, rating, comment } = req.body;

        await accountService.rateSeller(
          currentUserId,
          productId,
          seller_id,
          rating,
          comment,
        );

        return res.json({ success: true });
      } catch (error) {
        console.error("Error rating seller:", error);
        return res.json({
          success: false,
          message: "Failed to submit rating.",
        });
      }
    },

    putRateSeller: async (req, res) => {
      try {
        const currentUserId = req.session.authUser.id;
        const productId = req.params.productId;
        const { rating, comment } = req.body;

        await accountService.updateSellerRating(
          currentUserId,
          productId,
          rating,
          comment,
        );

        return res.json({ success: true });
      } catch (error) {
        console.error("Error updating rating:", error);
        return res.json({
          success: false,
          message: "Failed to update rating.",
        });
      }
    },

    getMyProducts: (req, res) => {
      return res.render("vwAccount/my-products");
    },

    getSoldProducts: (req, res) => {
      return res.render("vwAccount/sold-products");
    },
  };
}
