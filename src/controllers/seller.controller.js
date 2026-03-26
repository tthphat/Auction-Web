export function createSellerController({ sellerService }) {
  return {
    async getDashboard(req, res, next) {
      try {
        const sellerId = req.session.authUser.id;
        const data = await sellerService.getDashboard(sellerId);
        res.render("vwSeller/dashboard", data);
      } catch (err) {
        next(err);
      }
    },

    async getAllProducts(req, res, next) {
      try {
        const sellerId = req.session.authUser.id;
        const data = await sellerService.getAllProducts(sellerId);
        res.render("vwSeller/all-products", data);
      } catch (err) {
        next(err);
      }
    },

    async getActiveProducts(req, res, next) {
      try {
        const sellerId = req.session.authUser.id;
        const data = await sellerService.getActiveProducts(sellerId);
        res.render("vwSeller/active", data);
      } catch (err) {
        next(err);
      }
    },

    async getPendingProducts(req, res, next) {
      try {
        const sellerId = req.session.authUser.id;
        const message = req.query.message || null;
        const data = await sellerService.getPendingProducts(sellerId, message);
        res.render("vwSeller/pending", data);
      } catch (err) {
        next(err);
      }
    },

    async getSoldProducts(req, res, next) {
      try {
        const sellerId = req.session.authUser.id;
        const data = await sellerService.getSoldProducts(sellerId);
        res.render("vwSeller/sold-products", data);
      } catch (err) {
        next(err);
      }
    },

    async getExpiredProducts(req, res, next) {
      try {
        const sellerId = req.session.authUser.id;
        const data = await sellerService.getExpiredProducts(sellerId);
        res.render("vwSeller/expired", data);
      } catch (err) {
        next(err);
      }
    },

    async getAddProductForm(req, res, next) {
      try {
        const data = await sellerService.getAddProductForm(req);
        res.render("vwSeller/add", data);
      } catch (err) {
        next(err);
      }
    },

    async addProduct(req, res, next) {
      try {
        const sellerId = req.session.authUser.id;
        const productPayload = req.body;
        await sellerService.addProduct(req, productPayload, sellerId);
        res.redirect("/seller/products/add");
      } catch (err) {
        next(err);
      }
    },

    async uploadThumbnail(req, res, next) {
      try {
        res.json({
          success: true,
          file: req.file,
        });
      } catch (err) {
        next(err);
      }
    },

    async uploadSubimages(req, res, next) {
      try {
        res.json({
          success: true,
          files: req.files,
        });
      } catch (err) {
        next(err);
      }
    },

    async cancelProduct(req, res, next) {
      try {
        const productId = req.params.id;
        const sellerId = req.session.authUser.id;
        const { reason, highest_bidder_id } = req.body;

        const result = await sellerService.cancelProduct(
          productId,
          sellerId,
          reason,
          highest_bidder_id,
        );
        res.json(result);
      } catch (error) {
        console.error("Cancel product error:", error);

        if (error.message === "Product not found") {
          return res
            .status(404)
            .json({ success: false, message: "Product not found" });
        }
        if (error.message === "Unauthorized") {
          return res
            .status(403)
            .json({ success: false, message: "Unauthorized" });
        }

        res.status(500).json({ success: false, message: "Server error" });
      }
    },

    async rateProduct(req, res, next) {
      try {
        const productId = req.params.id;
        const sellerId = req.session.authUser.id;
        const { rating, comment, highest_bidder_id } = req.body;

        const result = await sellerService.rateProduct(
          productId,
          sellerId,
          rating,
          comment,
          highest_bidder_id,
        );
        res.json(result);
      } catch (error) {
        console.error("Rate bidder error:", error);

        if (error.message === "No bidder to rate") {
          return res
            .status(400)
            .json({ success: false, message: "No bidder to rate" });
        }

        res.status(500).json({ success: false, message: "Server error" });
      }
    },

    async updateProductRating(req, res, next) {
      try {
        const productId = req.params.id;
        const sellerId = req.session.authUser.id;
        const { rating, comment, highest_bidder_id } = req.body;

        const result = await sellerService.updateProductRating(
          productId,
          sellerId,
          rating,
          comment,
          highest_bidder_id,
        );
        res.json(result);
      } catch (error) {
        console.error("Update rating error:", error);

        if (error.message === "No bidder to rate") {
          return res
            .status(400)
            .json({ success: false, message: "No bidder to rate" });
        }

        res.status(500).json({ success: false, message: "Server error" });
      }
    },

    async appendDescription(req, res, next) {
      try {
        const productId = req.params.id;
        const sellerId = req.session.authUser.id;
        const { description } = req.body;

        const result = await sellerService.appendDescription(
          productId,
          sellerId,
          description,
          req,
        );
        res.json(result);
      } catch (error) {
        console.error("Append description error:", error);

        if (error.message === "Description is required") {
          return res
            .status(400)
            .json({ success: false, message: "Description is required" });
        }
        if (error.message === "Product not found") {
          return res
            .status(404)
            .json({ success: false, message: "Product not found" });
        }
        if (error.message === "Unauthorized") {
          return res
            .status(403)
            .json({ success: false, message: "Unauthorized" });
        }

        res.status(500).json({ success: false, message: "Server error" });
      }
    },

    async getDescriptionUpdates(req, res, next) {
      try {
        const productId = req.params.id;
        const sellerId = req.session.authUser.id;

        const result = await sellerService.getDescriptionUpdates(
          productId,
          sellerId,
        );
        res.json(result);
      } catch (error) {
        console.error("Get description updates error:", error);

        if (error.message === "Product not found") {
          return res
            .status(404)
            .json({ success: false, message: "Product not found" });
        }
        if (error.message === "Unauthorized") {
          return res
            .status(403)
            .json({ success: false, message: "Unauthorized" });
        }

        res.status(500).json({ success: false, message: "Server error" });
      }
    },

    async updateDescription(req, res, next) {
      try {
        const updateId = req.params.updateId;
        const sellerId = req.session.authUser.id;
        const { content } = req.body;

        const result = await sellerService.updateDescription(
          updateId,
          sellerId,
          content,
        );
        res.json(result);
      } catch (error) {
        console.error("Update description error:", error);

        if (error.message === "Content is required") {
          return res
            .status(400)
            .json({ success: false, message: "Content is required" });
        }
        if (error.message === "Update not found") {
          return res
            .status(404)
            .json({ success: false, message: "Update not found" });
        }
        if (error.message === "Unauthorized") {
          return res
            .status(403)
            .json({ success: false, message: "Unauthorized" });
        }

        res.status(500).json({ success: false, message: "Server error" });
      }
    },

    async deleteDescription(req, res, next) {
      try {
        const updateId = req.params.updateId;
        const sellerId = req.session.authUser.id;

        const result = await sellerService.deleteDescription(
          updateId,
          sellerId,
        );
        res.json(result);
      } catch (error) {
        console.error("Delete description error:", error);

        if (error.message === "Update not found") {
          return res
            .status(404)
            .json({ success: false, message: "Update not found" });
        }
        if (error.message === "Unauthorized") {
          return res
            .status(403)
            .json({ success: false, message: "Unauthorized" });
        }

        res.status(500).json({ success: false, message: "Server error" });
      }
    },
  };
}
