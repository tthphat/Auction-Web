import bcrypt from "bcryptjs";

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function createAccountService({ accountRepository, mailer }) {
  return {
    // Ratings page
    async getRatingsPageData(currentUserId) {
      const ratingData =
        await accountRepository.calculateRatingPoint(currentUserId);
      const rating_point = ratingData ? ratingData.rating_point : 0;
      const reviews = await accountRepository.getReviewsByUserId(currentUserId);

      const totalReviews = reviews.length;
      const positiveReviews = reviews.filter((r) => r.rating === 1).length;
      const negativeReviews = reviews.filter((r) => r.rating === -1).length;

      return {
        activeSection: "ratings",
        rating_point,
        reviews,
        totalReviews,
        positiveReviews,
        negativeReviews,
      };
    },

    // Signin view
    getSigninViewData(session) {
      const success_message = session.success_message;
      delete session.success_message;
      return { success_message };
    },

    // Verify email view
    getVerifyEmailViewData(email) {
      if (!email) return null;
      return {
        email,
        info_message:
          "We have sent an OTP to your email. Please enter it below to verify your account.",
      };
    },

    // Forgot password
    async requestForgotPassword(email) {
      const user = await accountRepository.findUserByEmail(email);
      if (!user) {
        return {
          ok: false,
          view: "vwAccount/auth/forgot-password",
          data: { error_message: "Email not found." },
        };
      }

      const otp = generateOtp();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

      await accountRepository.createOtp({
        user_id: user.id,
        otp_code: otp,
        purpose: "reset_password",
        expires_at: expiresAt,
      });

      await mailer.sendMail({
        to: email,
        subject: "Password Reset for Your Online Auction Account",
        html: `
          <p>Hi ${user.fullname},</p>
          <p>Your OTP code for password reset is: <strong>${otp}</strong></p>
          <p>This code will expire in 15 minutes.</p>
        `,
      });

      return {
        ok: true,
        view: "vwAccount/auth/verify-forgot-password-otp",
        data: { email },
      };
    },

    async verifyForgotPasswordOtp(email, otp) {
      const user = await accountRepository.findUserByEmail(email);
      if (!user) {
        return {
          ok: false,
          view: "vwAccount/auth/verify-forgot-password-otp",
          data: { email, error_message: "User not found." },
        };
      }

      const otpRecord = await accountRepository.findValidOtp({
        user_id: user.id,
        otp_code: otp,
        purpose: "reset_password",
      });

      if (!otpRecord) {
        return {
          ok: false,
          view: "vwAccount/auth/verify-forgot-password-otp",
          data: { email, error_message: "Invalid or expired OTP." },
        };
      }

      await accountRepository.markOtpUsed(otpRecord.id);
      return {
        ok: true,
        view: "vwAccount/auth/reset-password",
        data: { email },
      };
    },

    async resendForgotPasswordOtp(email) {
      const user = await accountRepository.findUserByEmail(email);
      if (!user) {
        return {
          ok: false,
          view: "vwAccount/auth/verify-forgot-password-otp",
          data: { email, error_message: "User not found." },
        };
      }

      const otp = generateOtp();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

      await accountRepository.createOtp({
        user_id: user.id,
        otp_code: otp,
        purpose: "reset_password",
        expires_at: expiresAt,
      });

      await mailer.sendMail({
        to: email,
        subject: "New OTP for Password Reset",
        html: `
          <p>Hi ${user.fullname},</p>
          <p>Your new OTP code for password reset is: <strong>${otp}</strong></p>
          <p>This code will expire in 15 minutes.</p>
        `,
      });

      return {
        ok: true,
        view: "vwAccount/auth/verify-forgot-password-otp",
        data: {
          email,
          info_message:
            "We have sent a new OTP to your email. Please check your inbox.",
        },
      };
    },

    async resetPassword(email, new_password, confirm_new_password) {
      if (new_password !== confirm_new_password) {
        return {
          ok: false,
          view: "vwAccount/auth/reset-password",
          data: { email, error_message: "Passwords do not match." },
        };
      }

      const user = await accountRepository.findUserByEmail(email);
      if (!user) {
        return {
          ok: false,
          view: "vwAccount/auth/reset-password",
          data: { email, error_message: "User not found." },
        };
      }

      const hashedPassword = bcrypt.hashSync(new_password, 10);
      await accountRepository.updateUser(user.id, {
        password_hash: hashedPassword,
      });

      return {
        ok: true,
        view: "vwAccount/auth/signin",
        data: {
          success_message: "Your password has been reset. You can sign in now.",
        },
      };
    },

    // Signin
    async signin(email, password, session) {
      const user = await accountRepository.findUserByEmail(email);
      if (!user) {
        return {
          ok: false,
          view: "vwAccount/auth/signin",
          data: { error_message: "Invalid email or password", old: { email } },
        };
      }

      const isPasswordValid = bcrypt.compareSync(password, user.password_hash);
      if (!isPasswordValid) {
        return {
          ok: false,
          view: "vwAccount/auth/signin",
          data: { error_message: "Invalid email or password", old: { email } },
        };
      }

      if (!user.email_verified) {
        const otp = generateOtp();
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

        await accountRepository.createOtp({
          user_id: user.id,
          otp_code: otp,
          purpose: "verify_email",
          expires_at: expiresAt,
        });

        await mailer.sendMail({
          to: email,
          subject: "Verify your Online Auction account",
          html: `
            <p>Hi ${user.fullname},</p>
            <p>Your OTP code is: <strong>${otp}</strong></p>
            <p>This code will expire in 15 minutes.</p>
          `,
        });

        return {
          ok: true,
          redirect: `/account/verify-email?email=${encodeURIComponent(email)}`,
        };
      }

      session.isAuthenticated = true;
      session.authUser = user;
      const returnUrl = session.returnUrl || "/";
      delete session.returnUrl;

      return { ok: true, redirect: returnUrl };
    },

    // Signup (keeps existing behavior, including recaptcha verify done in controller)
    async signup({ fullname, email, address, password }) {
      const hashedPassword = bcrypt.hashSync(password, 10);
      const user = {
        email,
        fullname,
        address,
        password_hash: hashedPassword,
        role: "bidder",
      };

      const newUser = await accountRepository.addUser(user);

      const otp = generateOtp();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

      await accountRepository.createOtp({
        user_id: newUser.id,
        otp_code: otp,
        purpose: "verify_email",
        expires_at: expiresAt,
      });

      const verifyUrl = `${process.env.APP_BASE_URL}/account/verify-email?email=${encodeURIComponent(email)}`;

      await mailer.sendMail({
        to: email,
        subject: "Verify your Online Auction account",
        html: `
          <p>Hi ${fullname},</p>
          <p>Thank you for registering at Online Auction.</p>
          <p>Your OTP code is: <strong>${otp}</strong></p>
          <p>This code will expire in 15 minutes.</p>
          <p>You can enter this code on the verification page, or click the link below:</p>
          <p><a href="${verifyUrl}">Verify your email</a></p>
          <p>If you did not register, please ignore this email.</p>
        `,
      });

      return {
        ok: true,
        redirect: `/account/verify-email?email=${encodeURIComponent(email)}`,
      };
    },

    async verifyEmail(email, otp, session) {
      const user = await accountRepository.findUserByEmail(email);
      if (!user) {
        return {
          ok: false,
          view: "vwAccount/verify-otp",
          data: { email, error_message: "User not found." },
        };
      }

      const otpRecord = await accountRepository.findValidOtp({
        user_id: user.id,
        otp_code: otp,
        purpose: "verify_email",
      });

      if (!otpRecord) {
        return {
          ok: false,
          view: "vwAccount/auth/verify-otp",
          data: { email, error_message: "Invalid or expired OTP." },
        };
      }

      await accountRepository.markOtpUsed(otpRecord.id);
      await accountRepository.verifyUserEmail(user.id);

      session.success_message =
        "Your email has been verified. You can sign in now.";
      return { ok: true, redirect: "/account/signin" };
    },

    async resendVerifyOtp(email) {
      const user = await accountRepository.findUserByEmail(email);
      if (!user) {
        return {
          ok: false,
          view: "vwAccount/auth/verify-otp",
          data: { email, error_message: "User not found." },
        };
      }

      if (user.email_verified) {
        return {
          ok: true,
          view: "vwAccount/auth/signin",
          data: {
            success_message: "Your email is already verified. Please sign in.",
          },
        };
      }

      const otp = generateOtp();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

      await accountRepository.createOtp({
        user_id: user.id,
        otp_code: otp,
        purpose: "verify_email",
        expires_at: expiresAt,
      });

      await mailer.sendMail({
        to: email,
        subject: "New OTP for email verification",
        html: `
          <p>Hi ${user.fullname},</p>
          <p>Your new OTP code is: <strong>${otp}</strong></p>
          <p>This code will expire in 15 minutes.</p>
        `,
      });

      return {
        ok: true,
        view: "vwAccount/verify-otp",
        data: {
          email,
          info_message:
            "We have sent a new OTP to your email. Please check your inbox.",
        },
      };
    },

    // Profile
    async getProfilePageData(currentUserId, query) {
      const user = await accountRepository.findUserById(currentUserId);

      let success_message = null;
      if (query.success === "true")
        success_message = "Profile updated successfully.";
      if (query["send-request-upgrade"] === "true") {
        success_message = "Your upgrade request has been sent successfully.";
      }

      return { user, success_message };
    },

    async updateProfile(currentUserId, payload) {
      const {
        email,
        fullname,
        address,
        date_of_birth,
        old_password,
        new_password,
        confirm_new_password,
      } = payload;

      const currentUser = await accountRepository.findUserById(currentUserId);

      if (!currentUser.oauth_provider) {
        if (
          !old_password ||
          !bcrypt.compareSync(old_password, currentUser.password_hash)
        ) {
          return {
            ok: false,
            view: "vwAccount/profile",
            data: { user: currentUser, err_message: "Password is incorrect!" },
          };
        }
      }

      if (email !== currentUser.email) {
        const existingUser = await accountRepository.findUserByEmail(email);
        if (existingUser) {
          return {
            ok: false,
            view: "vwAccount/profile",
            data: {
              user: currentUser,
              err_message: "Email is already in use by another user.",
            },
          };
        }
      }

      if (!currentUser.oauth_provider && new_password) {
        if (new_password !== confirm_new_password) {
          return {
            ok: false,
            view: "vwAccount/profile",
            data: {
              user: currentUser,
              err_message: "New passwords do not match.",
            },
          };
        }
      }

      const entity = {
        email,
        fullname,
        address: address || currentUser.address,
        date_of_birth: date_of_birth
          ? new Date(date_of_birth)
          : currentUser.date_of_birth,
      };

      if (!currentUser.oauth_provider) {
        entity.password_hash = new_password
          ? bcrypt.hashSync(new_password, 10)
          : currentUser.password_hash;
      }

      const updatedUser = await accountRepository.updateUser(
        currentUserId,
        entity,
      );

      if (updatedUser) {
        delete updatedUser.password_hash;
      }

      return { ok: true, updatedUser };
    },

    // Upgrade request
    async getUpgradeRequestPageData(currentUserId) {
      const upgradeRequest =
        await accountRepository.findUpgradeRequestByUserId(currentUserId);
      return { upgrade_request: upgradeRequest };
    },

    async submitUpgradeRequest(currentUserId) {
      await accountRepository.markUpgradePending(currentUserId);
      await accountRepository.createUpgradeRequest(currentUserId);
      return { ok: true };
    },

    // Watchlist
    async getWatchlistPageData(currentUserId, pageParam) {
      const limit = 3;
      const page = parseInt(pageParam) || 1;
      const offset = (page - 1) * limit;

      const [products, total] = await Promise.all([
        accountRepository.searchWatchlistPageByUserId(
          currentUserId,
          limit,
          offset,
        ),
        accountRepository.countWatchlistByUserId(currentUserId),
      ]);

      const totalCount = Number(total.count);
      const totalPages = Math.ceil(totalCount / limit);

      let from = (page - 1) * limit + 1;
      let to = page * limit;
      if (to > totalCount) to = totalCount;
      if (totalCount === 0) {
        from = 0;
        to = 0;
      }

      return {
        products,
        totalCount,
        from,
        to,
        currentPage: page,
        totalPages,
      };
    },

    // Bidding products
    async getBiddingProductsPageData(currentUserId) {
      const products =
        await accountRepository.getBiddingProductsByBidderId(currentUserId);
      return { activeSection: "bidding", products };
    },

    // Won auctions
    async getWonAuctionsPageData(currentUserId) {
      const products =
        await accountRepository.getWonAuctionsByBidderId(currentUserId);

      for (const product of products) {
        const review = await accountRepository.findReviewByReviewerAndProduct(
          currentUserId,
          product.id,
        );
        if (review && review.rating !== 0) {
          product.has_rated_seller = true;
          product.seller_rating = review.rating === 1 ? "positive" : "negative";
          product.seller_rating_comment = review.comment;
        } else {
          product.has_rated_seller = false;
        }
      }

      return { activeSection: "auctions", products };
    },

    // Rate seller (create/update)
    async rateSeller(currentUserId, productId, seller_id, rating, comment) {
      const ratingValue = rating === "positive" ? 1 : -1;

      const existingReview =
        await accountRepository.findReviewByReviewerAndProduct(
          currentUserId,
          productId,
        );

      if (existingReview) {
        await accountRepository.updateReviewByReviewerAndProduct(
          currentUserId,
          productId,
          {
            rating: ratingValue,
            comment: comment || null,
          },
        );
      } else {
        await accountRepository.createReview({
          reviewer_id: currentUserId,
          reviewed_user_id: seller_id,
          product_id: productId,
          rating: ratingValue,
          comment: comment || null,
        });
      }

      return { ok: true };
    },

    async updateSellerRating(currentUserId, productId, rating, comment) {
      const ratingValue = rating === "positive" ? 1 : -1;
      await accountRepository.updateReviewByReviewerAndProduct(
        currentUserId,
        productId,
        {
          rating: ratingValue,
          comment: comment || null,
        },
      );
      return { ok: true };
    },
  };
}
