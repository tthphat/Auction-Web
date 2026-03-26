import { sendMail } from "../utils/mailer.js";
import path from "path";
import fs from "fs";

export function createSellerService({ sellerRepository }) {
  return {
    // Dashboard
    async getDashboard(sellerId) {
      const stats = await sellerRepository.getSellerStats(sellerId);
      return { stats };
    },

    // All Products
    async getAllProducts(sellerId) {
      const products =
        await sellerRepository.findAllProductsBySellerId(sellerId);
      return { products };
    },

    // Active Products
    async getActiveProducts(sellerId) {
      const products =
        await sellerRepository.findActiveProductsBySellerId(sellerId);
      return { products };
    },

    // Pending Products
    async getPendingProducts(sellerId, message = null) {
      const [products, stats] = await Promise.all([
        sellerRepository.findPendingProductsBySellerId(sellerId),
        sellerRepository.getPendingProductsStats(sellerId),
      ]);

      let success_message = "";
      if (message === "cancelled") {
        success_message = "Auction cancelled successfully!";
      }

      return { products, stats, success_message };
    },

    // Sold Products
    async getSoldProducts(sellerId) {
      const [products, stats] = await Promise.all([
        sellerRepository.findSoldProductsBySellerId(sellerId),
        sellerRepository.getSoldProductsStats(sellerId),
      ]);

      // Fetch review info for each product
      const productsWithReview = await Promise.all(
        products.map(async (product) => {
          const review = await sellerRepository.getProductReview(
            sellerId,
            product.highest_bidder_id,
            product.id,
          );

          // Only show review if rating is not 0 (actual rating, not skip)
          const hasActualReview = review && review.rating !== 0;

          return {
            ...product,
            hasReview: hasActualReview,
            reviewRating: hasActualReview
              ? review.rating === 1
                ? "positive"
                : "negative"
              : null,
            reviewComment: hasActualReview ? review.comment : "",
          };
        }),
      );

      return { products: productsWithReview, stats };
    },

    // Expired Products
    async getExpiredProducts(sellerId) {
      const products =
        await sellerRepository.findExpiredProductsBySellerId(sellerId);

      // Add review info for cancelled products with bidders
      for (let product of products) {
        if (product.status === "Cancelled" && product.highest_bidder_id) {
          const review = await sellerRepository.getProductReview(
            sellerId,
            product.highest_bidder_id,
            product.id,
          );

          // Only show review if rating is not 0 (actual rating, not skip)
          const hasActualReview = review && review.rating !== 0;

          product.hasReview = hasActualReview;
          if (hasActualReview) {
            product.reviewRating =
              review.rating === 1 ? "positive" : "negative";
            product.reviewComment = review.comment;
          }
        }
      }

      return { products };
    },

    // Add Product Form
    async getAddProductForm(req) {
      const success_message = req.session.success_message;
      delete req.session.success_message;
      return { success_message };
    },

    // Add Product
    async addProduct(req, productPayload, sellerId) {
      const createdAtUTC = new Date(productPayload.created_at);
      const endAtUTC = new Date(productPayload.end_date);

      const productData = {
        seller_id: sellerId,
        category_id: productPayload.category_id,
        name: productPayload.name,
        starting_price: productPayload.start_price.replace(/,/g, ""),
        step_price: productPayload.step_price.replace(/,/g, ""),
        buy_now_price:
          productPayload.buy_now_price !== ""
            ? productPayload.buy_now_price.replace(/,/g, "")
            : null,
        created_at: createdAtUTC,
        end_at: endAtUTC,
        auto_extend: productPayload.auto_extend === "1" ? true : false,
        thumbnail: null,
        description: productPayload.description,
        highest_bidder_id: null,
        current_price: productPayload.start_price.replace(/,/g, ""),
        is_sold: null,
        allow_unrated_bidder:
          productPayload.allow_new_bidders === "1" ? true : false,
        closed_at: null,
      };

      const returnedID = await sellerRepository.addProduct(productData);
      const productId = returnedID[0].id;

      const dirPath = path
        .join("public", "images", "products")
        .replace(/\\/g, "/");

      const imgs = JSON.parse(productPayload.imgs_list);

      // Move and rename thumbnail
      const mainPath = path
        .join(dirPath, `p${productId}_thumb.jpg`)
        .replace(/\\/g, "/");
      const oldMainPath = path
        .join("public", "uploads", path.basename(productPayload.thumbnail))
        .replace(/\\/g, "/");
      const savedMainPath =
        "/" +
        path
          .join("images", "products", `p${productId}_thumb.jpg`)
          .replace(/\\/g, "/");
      fs.renameSync(oldMainPath, mainPath);
      await sellerRepository.updateProductThumbnail(productId, savedMainPath);

      // Move and rename subimages
      let i = 1;
      let newImgPaths = [];
      for (const imgPath of imgs) {
        const oldPath = path
          .join("public", "uploads", path.basename(imgPath))
          .replace(/\\/g, "/");
        const newPath = path
          .join(dirPath, `p${productId}_${i}.jpg`)
          .replace(/\\/g, "/");
        const savedPath =
          "/" +
          path
            .join("images", "products", `p${productId}_${i}.jpg`)
            .replace(/\\/g, "/");
        fs.renameSync(oldPath, newPath);
        newImgPaths.push({
          product_id: productId,
          img_link: savedPath,
        });
        i++;
      }

      await sellerRepository.addProductImages(newImgPaths);

      req.session.success_message = "Product added successfully!";
      return { success: true };
    },

    // Cancel Product
    async cancelProduct(
      productId,
      sellerId,
      reason = "",
      highestBidderId = null,
    ) {
      const product = await sellerRepository.cancelProduct(productId, sellerId);

      // Create review if there's a bidder
      if (highestBidderId) {
        const reviewData = {
          reviewer_id: sellerId,
          reviewee_id: highestBidderId,
          product_id: productId,
          rating: -1,
          comment: reason || "Auction cancelled by seller",
        };
        await sellerRepository.createReview(reviewData);
      }

      return { success: true, message: "Auction cancelled successfully" };
    },

    // Rate Product / Bidder
    async rateProduct(productId, sellerId, rating, comment, highestBidderId) {
      if (!highestBidderId) {
        throw new Error("No bidder to rate");
      }

      // Map rating: positive -> 1, negative -> -1
      const ratingValue = rating === "positive" ? 1 : -1;

      // Check if already rated
      const existingReview = await sellerRepository.findByReviewerAndProduct(
        sellerId,
        productId,
      );

      if (existingReview) {
        // Update existing review
        await sellerRepository.updateByReviewerAndProduct(sellerId, productId, {
          rating: ratingValue,
          comment: comment || null,
        });
      } else {
        // Create new review
        const reviewData = {
          reviewer_id: sellerId,
          reviewee_id: highestBidderId,
          product_id: productId,
          rating: ratingValue,
          comment: comment || "",
        };
        await sellerRepository.createReview(reviewData);
      }

      return { success: true, message: "Rating submitted successfully" };
    },

    // Update Product Rating
    async updateProductRating(
      productId,
      sellerId,
      rating,
      comment,
      highestBidderId,
    ) {
      if (!highestBidderId) {
        throw new Error("No bidder to rate");
      }

      // Map rating: positive -> 1, negative -> -1
      const ratingValue = rating === "positive" ? 1 : -1;

      // Update review
      await sellerRepository.updateReview(
        sellerId,
        highestBidderId,
        productId,
        {
          rating: ratingValue,
          comment: comment || "",
        },
      );

      return { success: true, message: "Rating updated successfully" };
    },

    // Append Description
    async appendDescription(productId, sellerId, description, req) {
      if (!description || description.trim() === "") {
        throw new Error("Description is required");
      }

      // Verify that the product belongs to the seller
      const product = await sellerRepository.findByProductId(productId, null);
      if (!product) {
        throw new Error("Product not found");
      }

      if (product.seller_id !== sellerId) {
        throw new Error("Unauthorized");
      }

      // Add description update
      await sellerRepository.addDescriptionUpdate(
        productId,
        description.trim(),
      );

      // Get unique bidders and commenters to notify
      const [bidders, commenters] = await Promise.all([
        sellerRepository.getUniqueBidders(productId),
        sellerRepository.getUniqueCommenters(productId),
      ]);

      // Combine and deduplicate by email (exclude seller)
      const notifyMap = new Map();
      [...bidders, ...commenters].forEach((user) => {
        if (user.id !== sellerId && !notifyMap.has(user.email)) {
          notifyMap.set(user.email, user);
        }
      });

      // Send email notifications (non-blocking)
      const notifyUsers = Array.from(notifyMap.values());
      if (notifyUsers.length > 0) {
        const productUrl = `${req.protocol}://${req.get("host")}/products/detail?id=${productId}`;

        // Send emails in background (don't await)
        Promise.all(
          notifyUsers.map((user) => {
            return sendMail({
              to: user.email,
              subject: `[Auction Update] New description added for "${product.name}"`,
              html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                            <div style="background: linear-gradient(135deg, #72AEC8 0%, #5a9bb8 100%); padding: 20px; text-align: center;">
                                <h1 style="color: white; margin: 0;">Product Description Updated</h1>
                            </div>
                            <div style="padding: 20px; background: #f9f9f9;">
                                <p>Hello <strong>${user.fullname}</strong>,</p>
                                <p>The seller has added new information to the product description:</p>
                                <div style="background: white; padding: 15px; border-left: 4px solid #72AEC8; margin: 15px 0;">
                                    <h3 style="margin: 0 0 10px 0; color: #333;">${product.name}</h3>
                                    <p style="margin: 0; color: #666;">Current Price: <strong style="color: #72AEC8;">${new Intl.NumberFormat("en-US").format(product.current_price)} VND</strong></p>
                                </div>
                                <div style="background: #fff8e1; padding: 15px; border-radius: 5px; margin: 15px 0;">
                                    <p style="margin: 0 0 10px 0; font-weight: bold; color: #f57c00;"><i>✉</i> New Description Added:</p>
                                    <div style="color: #333;">${description.trim()}</div>
                                </div>
                                <p>View the product to see the full updated description:</p>
                                <a href="${productUrl}" style="display: inline-block; background: #72AEC8; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; margin: 10px 0;">View Product</a>
                                <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
                                <p style="color: #999; font-size: 12px;">You received this email because you placed a bid or asked a question on this product.</p>
                            </div>
                        </div>
                    `,
            }).catch((err) =>
              console.error("Failed to send email to", user.email, err),
            );
          }),
        ).catch((err) => console.error("Email notification error:", err));
      }

      return { success: true, message: "Description appended successfully" };
    },

    // Get Description Updates
    async getDescriptionUpdates(productId, sellerId) {
      // Verify that the product belongs to the seller
      const product = await sellerRepository.findByProductId(productId, null);
      if (!product) {
        throw new Error("Product not found");
      }

      if (product.seller_id !== sellerId) {
        throw new Error("Unauthorized");
      }

      // Get all description updates for this product
      const updates =
        await sellerRepository.findDescriptionUpdatesByProductId(productId);

      return { success: true, updates };
    },

    // Update Description
    async updateDescription(updateId, sellerId, content) {
      if (!content || content.trim() === "") {
        throw new Error("Content is required");
      }

      // Get the update to verify ownership
      const update = await sellerRepository.findDescriptionUpdateById(updateId);
      if (!update) {
        throw new Error("Update not found");
      }

      // Verify that the product belongs to the seller
      const product = await sellerRepository.findByProductId(
        update.product_id,
        null,
      );
      if (!product || product.seller_id !== sellerId) {
        throw new Error("Unauthorized");
      }

      // Update the content
      await sellerRepository.updateDescriptionContent(updateId, content.trim());

      return { success: true, message: "Update saved successfully" };
    },

    // Delete Description
    async deleteDescription(updateId, sellerId) {
      // Get the update to verify ownership
      const update = await sellerRepository.findDescriptionUpdateById(updateId);
      if (!update) {
        throw new Error("Update not found");
      }

      // Verify that the product belongs to the seller
      const product = await sellerRepository.findByProductId(
        update.product_id,
        null,
      );
      if (!product || product.seller_id !== sellerId) {
        throw new Error("Unauthorized");
      }

      // Delete the update
      await sellerRepository.deleteDescriptionUpdate(updateId);

      return { success: true, message: "Update deleted successfully" };
    },
  };
}
