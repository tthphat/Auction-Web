export function createProductPublicController({ productService }) {
  return {
    getCategory: async (req, res) => {
      const userId = req.session.authUser ? req.session.authUser.id : null;
      const sort = req.query.sort || "";
      const categoryId = req.query.catid;
      const page = parseInt(req.query.page) || 1;

      const result = await productService.getCategoryPage({
        userId,
        categoryId,
        page,
        sort,
      });

      return res.render(result.view, result.data);
    },

    getSearch: async (req, res) => {
      const userId = req.session.authUser ? req.session.authUser.id : null;
      const q = req.query.q || "";
      const logic = req.query.logic || "and";
      const sort = req.query.sort || "";
      const page = parseInt(req.query.page) || 1;

      const result = await productService.getSearchPage({
        userId,
        q,
        logic,
        page,
        sort,
      });

      return res.render(result.view, result.data);
    },

    getDetail: async (req, res) => {
      const userId = req.session.authUser ? req.session.authUser.id : null;
      const productId = req.query.id;
      const commentPage = parseInt(req.query.commentPage) || 1;

      const result = await productService.getDetailPage({
        userId,
        productId,
        commentPage,
      });

      if (result?.notFound) {
        return res.status(404).render("404", { message: "Product not found" });
      }

      if (result?.forbidden) {
        return res.status(403).render("403", {
          message: "You do not have permission to view this product",
        });
      }

      return res.render(result.view, {
        ...result.data,
        authUser: req.session.authUser,
        success_message,
        error_message,
      });
    },

    getBiddingHistory: async (req, res) => {
      const productId = req.query.id;
      try {
        const result = await productService.getBiddingHistoryPage(productId);
        if (result.redirect) return res.redirect(result.redirect);
        if (result.notFound) {
          return res
            .status(404)
            .render("404", { message: "Product not found" });
        }
        return res.render(result.view, result.data);
      } catch (error) {
        console.error("Error loading bidding history:", error);
        return res
          .status(500)
          .render("500", { message: "Unable to load bidding history" });
      }
    },

    postWatchlist: async (req, res) => {
      const userId = req.session.authUser.id;
      const productId = req.body.productId;

      await productService.addToWatchlist(userId, productId);
      const retUrl = req.headers.referer || "/";
      return res.redirect(retUrl);
    },

    deleteWatchlist: async (req, res) => {
      const userId = req.session.authUser.id;
      const productId = req.body.productId;

      await productService.removeFromWatchlist(userId, productId);
      const retUrl = req.headers.referer || "/";
      return res.redirect(retUrl);
    },

    async postBid(req, res) {
      try {
        if (!req.session.authUser) {
          req.session.success_message = "You must be logged in to bid.";
          return res.redirect(`/account/signin?retUrl=${req.originalUrl}`);
        }

        const userId = req.session.authUser.id;
        const { productId, bidAmount } = req.body;

        const bidAmountFloat = parseFloat(bidAmount);
        if (!productId || Number.isNaN(bidAmountFloat)) {
          req.session.success_message = "Invalid bid input.";
          return res.redirect(`/products/detail?id=${productId}`);
        }

        const { ok, success_message, error_message } =
          await productService.placeBid({
            userId,
            productId,
            bidAmount: bidAmountFloat,
            req,
          });

        req.session.success_message = ok
          ? success_message
          : error_message || "Failed to place bid";
        return res.redirect(`/products/detail?id=${productId}`);
      } catch (err) {
        console.error(err);
        const productId = req.body?.productId;
        req.session.success_message = err.message || "Failed to place bid";
        return res.redirect(`/products/detail?id=${productId}`);
      }
    },

    async postComment(req, res) {
      try {
        if (!req.session.authUser) {
          req.session.success_message = "You must be logged in to comment.";
          return res.redirect(`/account/signin?retUrl=${req.originalUrl}`);
        }

        const userId = req.session.authUser.id;
        const { productId, content, parentId } = req.body;

        const result = await productService.postComment({
          userId,
          productId,
          content,
          parentId,
          req,
        });

        req.session.success_message = result.ok
          ? result.success_message
          : result.error_message;
        return res.redirect(`/products/detail?id=${productId}`);
      } catch (err) {
        console.error(err);
        const productId = req.body?.productId;
        req.session.success_message = err.message || "Failed to post comment";
        return res.redirect(`/products/detail?id=${productId}`);
      }
    },

    async getBidHistory(req, res) {
      try {
        const { productId } = req.params;
        const { ok, history } =
          await productService.getBidHistoryJson(productId);
        return res.json({ ok, history });
      } catch (err) {
        console.error(err);
        return res.status(500).json({ ok: false, message: "Server error" });
      }
    },

    async getCompleteOrder(req, res) {
      try {
        if (!req.session.authUser) {
          return res.redirect(`/account/signin?retUrl=${req.originalUrl}`);
        }
        const userId = req.session.authUser.id;
        const { id: productId } = req.query;

        const page = await productService.getCompleteOrderPage({
          userId,
          productId,
        });

        if (page.redirect) return res.redirect(page.redirect);
        if (page.notFound) return res.status(404).render("404");
        if (page.forbidden) return res.status(403).render("403");

        return res.render(page.view, page.data);
      } catch (err) {
        console.error(err);
        return res.status(500).render("500", { message: "Server error" });
      }
    },

    async postOrderUploadImages(req, res) {
      // Keep behavior consistent: multer middleware runs in route, controller just returns urls
      try {
        const files = req.files || [];
        const imageUrls = files.map((file) =>
          `/public/images/${file.fieldname}/${file.filename}`.replace(
            "/public",
            "",
          ),
        );
        return res.json({ ok: true, imageUrls });
      } catch (err) {
        console.error(err);
        return res.status(500).json({ ok: false, message: "Server error" });
      }
    },

    async postOrderSubmitPayment(req, res) {
      try {
        if (!req.session.authUser) {
          return res.status(401).json({ ok: false, message: "Unauthorized" });
        }
        const userId = req.session.authUser.id;
        const { orderId } = req.params;
        const result = await productService.submitPayment({
          orderId,
          userId,
          payload: req.body,
        });

        if (!result.ok) {
          return res
            .status(result.status || 400)
            .json({ ok: false, message: result.error || "Failed" });
        }
        return res.json({ ok: true });
      } catch (err) {
        console.error(err);
        return res.status(500).json({ ok: false, message: "Server error" });
      }
    },

    async postOrderConfirmPayment(req, res) {
      try {
        if (!req.session.authUser) {
          return res.status(401).json({ ok: false, message: "Unauthorized" });
        }
        const userId = req.session.authUser.id;
        const { orderId } = req.params;
        const result = await productService.confirmPayment({ orderId, userId });
        if (!result.ok) {
          return res
            .status(result.status || 400)
            .json({ ok: false, message: result.error || "Failed" });
        }
        return res.json({ ok: true });
      } catch (err) {
        console.error(err);
        return res.status(500).json({ ok: false, message: "Server error" });
      }
    },

    async postOrderSubmitShipping(req, res) {
      try {
        if (!req.session.authUser) {
          return res.status(401).json({ ok: false, message: "Unauthorized" });
        }
        const userId = req.session.authUser.id;
        const { orderId } = req.params;
        const result = await productService.submitShipping({
          orderId,
          userId,
          payload: req.body,
        });
        if (!result.ok) {
          return res
            .status(result.status || 400)
            .json({ ok: false, message: result.error || "Failed" });
        }
        return res.json({ ok: true });
      } catch (err) {
        console.error(err);
        return res.status(500).json({ ok: false, message: "Server error" });
      }
    },

    async postOrderConfirmDelivery(req, res) {
      try {
        if (!req.session.authUser) {
          return res.status(401).json({ ok: false, message: "Unauthorized" });
        }
        const userId = req.session.authUser.id;
        const { orderId } = req.params;
        const result = await productService.confirmDelivery({
          orderId,
          userId,
        });
        if (!result.ok) {
          return res
            .status(result.status || 400)
            .json({ ok: false, message: result.error || "Failed" });
        }
        return res.json({ ok: true });
      } catch (err) {
        console.error(err);
        return res.status(500).json({ ok: false, message: "Server error" });
      }
    },

    async postOrderSubmitRating(req, res) {
      try {
        if (!req.session.authUser) {
          return res.status(401).json({ ok: false, message: "Unauthorized" });
        }
        const userId = req.session.authUser.id;
        const { orderId } = req.params;
        const { rating, comment } = req.body;
        const result = await productService.submitOrderRating({
          orderId,
          userId,
          rating,
          comment,
        });
        if (!result.ok) {
          return res
            .status(result.status || 400)
            .json({ ok: false, message: result.error || "Failed" });
        }
        return res.json({ ok: true });
      } catch (err) {
        console.error(err);
        return res.status(500).json({ ok: false, message: "Server error" });
      }
    },

    async postOrderCompleteSkip(req, res) {
      try {
        if (!req.session.authUser) {
          return res.status(401).json({ ok: false, message: "Unauthorized" });
        }
        const userId = req.session.authUser.id;
        const { orderId } = req.params;
        const result = await productService.completeTransactionSkip({
          orderId,
          userId,
        });
        if (!result.ok) {
          return res
            .status(result.status || 400)
            .json({ ok: false, message: result.error || "Failed" });
        }
        return res.json({ ok: true });
      } catch (err) {
        console.error(err);
        return res.status(500).json({ ok: false, message: "Server error" });
      }
    },

    async postOrderSendMessage(req, res) {
      try {
        if (!req.session.authUser) {
          return res.status(401).json({ ok: false, message: "Unauthorized" });
        }
        const userId = req.session.authUser.id;
        const { orderId } = req.params;
        const { message } = req.body;
        const result = await productService.sendOrderMessage({
          orderId,
          userId,
          message,
        });
        if (!result.ok) {
          return res
            .status(result.status || 400)
            .json({ ok: false, message: result.error || "Failed" });
        }
        return res.json({ ok: true });
      } catch (err) {
        console.error(err);
        return res.status(500).json({ ok: false, message: "Server error" });
      }
    },

    async getOrderMessages(req, res) {
      try {
        if (!req.session.authUser) {
          return res.status(401).json({ ok: false, message: "Unauthorized" });
        }
        const userId = req.session.authUser.id;
        const { orderId } = req.params;
        const result = await productService.getOrderMessages({
          orderId,
          userId,
        });
        if (!result.ok) {
          return res
            .status(result.status || 400)
            .json({ ok: false, message: result.error || "Failed" });
        }
        return res.json({ ok: true, messages: result.messages });
      } catch (err) {
        console.error(err);
        return res.status(500).json({ ok: false, message: "Server error" });
      }
    },

    async postRejectBidder(req, res) {
      try {
        if (!req.session.authUser) {
          return res.status(401).json({ ok: false, message: "Unauthorized" });
        }
        const sellerId = req.session.authUser.id;
        const { productId, bidderId } = req.body;
        await productService.rejectBidder({ productId, bidderId, sellerId });
        return res.json({ ok: true });
      } catch (err) {
        console.error(err);
        return res.status(500).json({ ok: false, message: err.message });
      }
    },

    async postUnrejectBidder(req, res) {
      try {
        if (!req.session.authUser) {
          return res.status(401).json({ ok: false, message: "Unauthorized" });
        }
        const sellerId = req.session.authUser.id;
        const { productId, bidderId } = req.body;
        await productService.unrejectBidder({ productId, bidderId, sellerId });
        return res.json({ ok: true });
      } catch (err) {
        console.error(err);
        return res.status(500).json({ ok: false, message: err.message });
      }
    },

    async postBuyNow(req, res) {
      try {
        if (!req.session.authUser) {
          return res.status(401).json({
            success: false,
            message: "You must be logged in to use Buy Now.",
            redirectUrl: `/account/signin?retUrl=/products/detail?id=${req.body?.productId}`
          });
        }

        const userId = req.session.authUser.id;
        const { productId } = req.body;

        const result = await productService.buyNow({ productId, userId });

        return res.json({
          success: true,
          message: result.message,
          redirectUrl: result.redirectUrl
        });
      } catch (err) {
        console.error(err);
        return res.status(500).json({
          success: false,
          message: err.message || "Buy now failed"
        });
      }
    },

    async getSellerRatings(req, res) {
      try {
        const { sellerId } = req.params;
        const page = await productService.getSellerRatingsPage(sellerId);
        if (page.notFound) return res.status(404).render("404");
        return res.render(page.view, page.data);
      } catch (err) {
        console.error(err);
        return res.status(500).render("500", { message: "Server error" });
      }
    },

    async getBidderRatings(req, res) {
      try {
        const { bidderId } = req.params;
        const page = await productService.getBidderRatingsPage(bidderId);
        if (page.notFound) return res.status(404).render("404");
        return res.render(page.view, page.data);
      } catch (err) {
        console.error(err);
        return res.status(500).render("500", { message: "Server error" });
      }
    },
  };
}
