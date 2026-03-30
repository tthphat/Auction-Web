export function createProductPublicService({ productRepository, mailer }) {
  async function prepareProductList(products) {
    const now = new Date();
    if (!products) return [];

    const settings = await productRepository.getSettings();
    const N_MINUTES = settings.new_product_limit_minutes;

    return products.map((product) => {
      const created = new Date(product.created_at);
      const isNew = now - created < N_MINUTES * 60 * 1000;
      return { ...product, is_new: isNew };
    });
  }

  function getProductStatus(product) {
    const now = new Date();
    const endDate = new Date(product.end_at);

    if (product.is_sold === true) return "SOLD";
    if (product.is_sold === false) return "CANCELLED";
    if ((endDate <= now || product.closed_at) && product.highest_bidder_id)
      return "PENDING";
    if (endDate <= now && !product.highest_bidder_id) return "EXPIRED";
    return "ACTIVE";
  }

  return {
    async getCategoryPage({ userId, categoryId, page, sort }) {
      const limit = 3;
      const offset = (page - 1) * limit;

      const category = await productRepository.findCategoryById(categoryId);

      let categoryIds = [categoryId];
      if (category && category.parent_id === null) {
        const childCategories =
          await productRepository.findChildCategoryIds(categoryId);
        const childIds = childCategories.map((cat) => cat.id);
        categoryIds = [categoryId, ...childIds];
      }

      const list = await productRepository.findProductsByCategoryIds(
        categoryIds,
        limit,
        offset,
        sort,
        userId,
      );
      const products = await prepareProductList(list);

      const total = await productRepository.countByCategoryIds(categoryIds);
      const totalCount = parseInt(total.count) || 0;
      const totalPages = Math.ceil(totalCount / limit);

      let from = (page - 1) * limit + 1;
      let to = page * limit;
      if (to > totalCount) to = totalCount;
      if (totalCount === 0) {
        from = 0;
        to = 0;
      }

      return {
        view: "vwProduct/list",
        data: {
          products,
          totalCount,
          from,
          to,
          currentPage: page,
          totalPages,
          categoryId,
          categoryName: category ? category.name : null,
          sort,
        },
      };
    },

    async getSearchPage({ userId, q, logic, page, sort }) {
      if (q.length === 0) {
        return {
          view: "vwProduct/list",
          data: {
            q,
            logic,
            sort,
            products: [],
            totalCount: 0,
            from: 0,
            to: 0,
            currentPage: 1,
            totalPages: 0,
          },
        };
      }

      const limit = 3;
      const offset = (page - 1) * limit;
      const keywords = q.trim();

      const list = await productRepository.searchPageByKeywords(
        keywords,
        limit,
        offset,
        userId,
        logic,
        sort,
      );
      const products = await prepareProductList(list);

      const total = await productRepository.countByKeywords(keywords, logic);
      const totalCount = parseInt(total.count) || 0;
      const totalPages = Math.ceil(totalCount / limit);

      let from = (page - 1) * limit + 1;
      let to = page * limit;
      if (to > totalCount) to = totalCount;
      if (totalCount === 0) {
        from = 0;
        to = 0;
      }

      return {
        view: "vwProduct/list",
        data: {
          products,
          totalCount,
          from,
          to,
          currentPage: page,
          totalPages,
          q,
          logic,
          sort,
        },
      };
    },

    async getDetailPage({ userId, productId, commentPage }) {
      const product = await productRepository.findByProductId2(
        productId,
        userId,
      );
      const related_products =
        await productRepository.findRelatedProducts(productId);

      if (!product) {
        return { notFound: true };
      }

      const now = new Date();
      const endDate = new Date(product.end_at);

      if (endDate <= now && !product.closed_at && product.is_sold === null) {
        await productRepository.updateProduct(productId, {
          closed_at: endDate,
        });
        product.closed_at = endDate;
      }

      const productStatus = getProductStatus(product);

      if (productStatus !== "ACTIVE") {
        if (!userId) {
          return { forbidden: true };
        }

        const isSeller = product.seller_id === userId;
        const isHighestBidder = product.highest_bidder_id === userId;

        if (!isSeller && !isHighestBidder) {
          return { forbidden: true };
        }
      }

      const commentsPerPage = 2;
      const offset = (commentPage - 1) * commentsPerPage;

      const [descriptionUpdates, biddingHistory, comments, totalComments] =
        await Promise.all([
          productRepository.findDescriptionUpdatesByProductId(productId),
          productRepository.getBiddingHistory(productId),
          productRepository.getCommentsByProductId(
            productId,
            commentsPerPage,
            offset,
          ),
          productRepository.countCommentsByProductId(productId),
        ]);

      let rejectedBidders = [];
      if (userId && product.seller_id === userId) {
        rejectedBidders = await productRepository.getRejectedBidders(productId);
      }

      if (comments.length > 0) {
        const commentIds = comments.map((c) => c.id);
        const allReplies =
          await productRepository.getRepliesByCommentIds(commentIds);

        const repliesMap = new Map();
        for (const reply of allReplies) {
          if (!repliesMap.has(reply.parent_id)) {
            repliesMap.set(reply.parent_id, []);
          }
          repliesMap.get(reply.parent_id).push(reply);
        }

        for (const comment of comments) {
          comment.replies = repliesMap.get(comment.id) || [];
        }
      }

      const totalPages = Math.ceil(totalComments / commentsPerPage);

      const sellerRatingObject = await productRepository.calculateRatingPoint(
        product.seller_id,
      );
      const sellerReviews = await productRepository.getReviewsByUserId(
        product.seller_id,
      );

      let bidderRatingObject = { rating_point: null };
      let bidderReviews = [];
      if (product.highest_bidder_id) {
        bidderRatingObject = await productRepository.calculateRatingPoint(
          product.highest_bidder_id,
        );
        bidderReviews = await productRepository.getReviewsByUserId(
          product.highest_bidder_id,
        );
      }

      let showPaymentButton = false;
      if (userId && productStatus === "PENDING") {
        showPaymentButton =
          product.seller_id === userId || product.highest_bidder_id === userId;
      }

      return {
        view: "vwProduct/details",
        data: {
          product,
          productStatus,
          descriptionUpdates,
          biddingHistory,
          rejectedBidders,
          comments,
          related_products,
          seller_rating_point: sellerRatingObject.rating_point,
          seller_has_reviews: sellerReviews.length > 0,
          bidder_rating_point: bidderRatingObject.rating_point,
          bidder_has_reviews: bidderReviews.length > 0,
          commentPage,
          totalPages,
          totalComments,
          showPaymentButton,
        },
      };
    },

    async getBiddingHistoryPage(productId) {
      if (!productId) {
        return { redirect: "/" };
      }

      const product = await productRepository.findByProductId2(productId, null);
      if (!product) {
        return { notFound: true };
      }

      const biddingHistory =
        await productRepository.getBiddingHistory(productId);
      return {
        view: "vwProduct/biddingHistory",
        data: { product, biddingHistory },
      };
    },

    async addToWatchlist(userId, productId) {
      const isInWatchlist = await productRepository.isInWatchlist(
        userId,
        productId,
      );
      if (!isInWatchlist) {
        await productRepository.addToWatchlist(userId, productId);
      }
      return { ok: true };
    },

    async removeFromWatchlist(userId, productId) {
      await productRepository.removeFromWatchlist(userId, productId);
      return { ok: true };
    },

    async placeBid({ userId, productId, bidAmount, req }) {
      const result = await productRepository.db.transaction(async (trx) => {
        const product = await trx("products")
          .where("id", productId)
          .forUpdate()
          .first();

        if (!product) {
          throw new Error("Product not found");
        }

        const previousHighestBidderId = product.highest_bidder_id;
        const previousPrice = parseFloat(
          product.current_price || product.starting_price,
        );

        if (product.is_sold === true) {
          throw new Error("This product has already been sold");
        }

        if (product.seller_id === userId) {
          throw new Error("You cannot bid on your own product");
        }

        const isRejected = await trx("rejected_bidders")
          .where("product_id", productId)
          .where("bidder_id", userId)
          .first();

        if (isRejected) {
          throw new Error(
            "You have been rejected from bidding on this product by the seller",
          );
        }

        const ratingPoint =
          await productRepository.calculateRatingPoint(userId);
        const userReviews = await productRepository.getReviewsByUserId(userId);
        const hasReviews = userReviews.length > 0;

        if (!hasReviews) {
          if (!product.allow_unrated_bidder) {
            throw new Error(
              "This seller does not allow unrated bidders to bid on this product.",
            );
          }
        } else if (ratingPoint.rating_point < 0) {
          throw new Error(
            "You are not eligible to place bids due to your rating.",
          );
        } else if (ratingPoint.rating_point === 0) {
          throw new Error(
            "You are not eligible to place bids due to your rating.",
          );
        } else if (ratingPoint.rating_point <= 0.8) {
          throw new Error(
            "Your rating point is not greater than 80%. You cannot place bids.",
          );
        }

        const now = new Date();
        const endDate = new Date(product.end_at);
        if (now > endDate) {
          throw new Error("This auction has ended");
        }

        const currentPrice = parseFloat(
          product.current_price || product.starting_price,
        );
        if (bidAmount <= currentPrice) {
          throw new Error("Bid amount must be higher than current price");
        }

        const minIncrement = parseFloat(product.step_price);
        if (bidAmount < currentPrice + minIncrement) {
          throw new Error(
            `Bid amount must be at least ${currentPrice + minIncrement}`,
          );
        }

        let extendedEndTime = null;
        if (product.auto_extend) {
          const remainingMs = endDate - now;
          const fiveMinutesMs = 5 * 60 * 1000;
          if (remainingMs <= fiveMinutesMs) {
            extendedEndTime = new Date(endDate.getTime() + fiveMinutesMs);
          }
        }

        let newCurrentPrice;
        let newHighestBidderId;
        let newHighestMaxPrice;
        let shouldCreateHistory = true;

        const buyNowPrice = product.buy_now_price
          ? parseFloat(product.buy_now_price)
          : null;
        let buyNowTriggered = false;

        if (
          buyNowPrice &&
          product.highest_bidder_id &&
          product.highest_max_price &&
          product.highest_bidder_id !== userId
        ) {
          const existingMax = parseFloat(product.highest_max_price);
          if (existingMax >= buyNowPrice) {
            newCurrentPrice = buyNowPrice;
            newHighestBidderId = product.highest_bidder_id;
            newHighestMaxPrice = existingMax;
            buyNowTriggered = true;
          }
        }

        if (!buyNowTriggered) {
          const existingMax = product.highest_max_price
            ? parseFloat(product.highest_max_price)
            : null;

          if (!product.highest_bidder_id) {
            newHighestBidderId = userId;
            newHighestMaxPrice = bidAmount;
            newCurrentPrice = bidAmount;
          } else if (product.highest_bidder_id === userId) {
            newHighestBidderId = userId;
            newHighestMaxPrice = bidAmount;
            newCurrentPrice = currentPrice;
            shouldCreateHistory = false;
          } else {
            const challengerMax = bidAmount;

            if (existingMax === null) {
              newHighestBidderId = userId;
              newHighestMaxPrice = challengerMax;
              newCurrentPrice = bidAmount;
            } else if (challengerMax > existingMax) {
              newHighestBidderId = userId;
              newHighestMaxPrice = challengerMax;
              const nextPrice = existingMax + minIncrement;
              newCurrentPrice = Math.min(nextPrice, challengerMax);
            } else {
              newHighestBidderId = product.highest_bidder_id;
              newHighestMaxPrice = existingMax;
              const nextPrice = challengerMax + minIncrement;
              newCurrentPrice = Math.min(nextPrice, existingMax);
            }
          }

          if (buyNowPrice && newCurrentPrice >= buyNowPrice) {
            newCurrentPrice = buyNowPrice;
            buyNowTriggered = true;
          }
        }

        const productSold = buyNowTriggered;

        const updateData = {
          current_price: newCurrentPrice,
          highest_bidder_id: newHighestBidderId,
          highest_max_price: newHighestMaxPrice,
        };

        if (productSold) {
          updateData.is_sold = null;
          updateData.closed_at = new Date();
        } else if (extendedEndTime) {
          updateData.end_at = extendedEndTime;
        }

        await trx("products").where("id", productId).update(updateData);

        if (shouldCreateHistory) {
          await trx("bidding_history").insert({
            product_id: productId,
            bidder_id: newHighestBidderId,
            current_price: newCurrentPrice,
            created_at: new Date(),
          });
        }

        await trx.raw(
          `
            INSERT INTO auto_bidding (product_id, bidder_id, max_price)
            VALUES (?, ?, ?)
            ON CONFLICT (product_id, bidder_id)
            DO UPDATE SET
              max_price = EXCLUDED.max_price,
              created_at = NOW()
          `,
          [productId, userId, bidAmount],
        );

        return {
          newCurrentPrice,
          newHighestBidderId,
          userId,
          bidAmount,
          productSold,
          autoExtended: !!extendedEndTime,
          newEndTime: extendedEndTime,
          productName: product.name,
          sellerId: product.seller_id,
          previousHighestBidderId,
          previousPrice,
          priceChanged: previousPrice !== newCurrentPrice,
        };
      });

      const productUrl = `${req.protocol}://${req.get("host")}/products/detail?id=${productId}`;

      (async () => {
        try {
          const seller = await productRepository.findUserById(result.sellerId);
          const bidder = await productRepository.findUserById(userId);

          if (seller?.email) {
            mailer.sendMail({
              to: seller.email,
              subject: `New bid on ${result.productName}`,
              html: `
                <p>Hi ${seller.fullname},</p>
                <p>There is a new bid on <strong>${result.productName}</strong>.</p>
                <p>Current price: <strong>${result.newCurrentPrice}</strong></p>
                <p><a href="${productUrl}">View product</a></p>
              `,
            });
          }

          if (
            result.previousHighestBidderId &&
            result.previousHighestBidderId !== result.newHighestBidderId
          ) {
            const prevBidder = await productRepository.findUserById(
              result.previousHighestBidderId,
            );
            if (prevBidder?.email) {
              mailer.sendMail({
                to: prevBidder.email,
                subject: `You've been outbid on ${result.productName}`,
                html: `
                  <p>Hi ${prevBidder.fullname},</p>
                  <p>You have been outbid on <strong>${result.productName}</strong>.</p>
                  <p><a href="${productUrl}">Place a new bid</a></p>
                `,
              });
            }
          }

          if (result.productSold && bidder?.email) {
            mailer.sendMail({
              to: bidder.email,
              subject: `Buy now reached for ${result.productName}`,
              html: `
                <p>Hi ${bidder.fullname},</p>
                <p>The auction reached the buy now price for <strong>${result.productName}</strong>.</p>
                <p><a href="${productUrl}">View details</a></p>
              `,
            });
          }
        } catch (emailError) {
          console.error("Bid email error:", emailError);
        }
      })();

      let baseMessage = "";
      if (result.productSold) {
        if (result.newHighestBidderId === result.userId) {
          baseMessage =
            "Buy now reached! You are the winner. Please proceed to payment.";
        } else {
          baseMessage =
            "Buy now reached! The product is now pending for payment.";
        }
      } else if (result.newHighestBidderId === result.userId) {
        baseMessage = "Bid placed successfully! You are the highest bidder.";
      } else {
        baseMessage = "Bid placed successfully!";
      }

      if (result.autoExtended) {
        const extendedTimeStr = new Date(result.newEndTime).toLocaleString(
          "vi-VN",
        );
        baseMessage += ` | Auction extended to ${extendedTimeStr}`;
      }

      return { ok: true, result, success_message: baseMessage };
    },

    async postComment({ userId, productId, content, parentId, req }) {
      if (!content || content.trim().length === 0) {
        return { ok: false, error_message: "Comment cannot be empty" };
      }

      await productRepository.createComment(
        productId,
        userId,
        content.trim(),
        parentId || null,
      );

      const product = await productRepository.findByProductId2(productId, null);
      const commenter = await productRepository.findUserById(userId);
      const seller = await productRepository.findUserById(product.seller_id);
      const productUrl = `${req.protocol}://${req.get("host")}/products/detail?id=${productId}`;

      const isSellerReplying = userId === product.seller_id;

      // Keep email notification minimal: notify seller when bidder comments.
      try {
        if (!isSellerReplying && seller?.email) {
          mailer.sendMail({
            to: seller.email,
            subject: `New comment on ${product.name}`,
            html: `
              <p>Hi ${seller.fullname},</p>
              <p>${commenter?.fullname || "A user"} commented on <strong>${product.name}</strong>.</p>
              <p><a href="${productUrl}">View comment</a></p>
            `,
          });
        }
      } catch (e) {
        console.error("Comment email error:", e);
      }

      return { ok: true, success_message: "Comment posted successfully!" };
    },

    async getBidHistoryJson(productId) {
      const history = await productRepository.getBiddingHistory(productId);
      return { ok: true, history };
    },

    async getCompleteOrderPage({ userId, productId }) {
      if (!productId) return { redirect: "/" };

      const product = await productRepository.findByProductId2(
        productId,
        userId,
      );
      if (!product) return { notFound: true };

      const status = getProductStatus(product);
      if (status !== "PENDING") {
        return { redirect: `/products/detail?id=${productId}` };
      }

      const isSeller = product.seller_id === userId;
      const isHighestBidder = product.highest_bidder_id === userId;
      if (!isSeller && !isHighestBidder) {
        return { forbidden: true };
      }

      let order = await productRepository.findOrderByProductId(productId);
      if (!order) {
        await productRepository.createOrder({
          product_id: productId,
          buyer_id: product.highest_bidder_id,
          seller_id: product.seller_id,
          final_price: product.current_price || product.highest_bid || 0,
        });
        order = await productRepository.findOrderByProductId(productId);
      }

      let paymentInvoice = await productRepository.getPaymentInvoice(order.id);
      let shippingInvoice = await productRepository.getShippingInvoice(
        order.id,
      );

      const normalizeArray = (val) => {
        if (!val) return val;
        if (Array.isArray(val)) return val;
        if (typeof val !== "string") return val;
        try {
          const parsed = JSON.parse(val);
          return Array.isArray(parsed) ? parsed : val;
        } catch {
          // Postgres array string like {a,b}
          if (val.startsWith("{") && val.endsWith("}")) {
            return val
              .slice(1, -1)
              .split(",")
              .map((s) => s.replace(/^\"|\"$/g, ""))
              .filter(Boolean);
          }
          return val;
        }
      };

      if (paymentInvoice?.payment_proof_urls) {
        paymentInvoice.payment_proof_urls = normalizeArray(
          paymentInvoice.payment_proof_urls,
        );
      }
      if (shippingInvoice?.shipping_proof_urls) {
        shippingInvoice.shipping_proof_urls = normalizeArray(
          shippingInvoice.shipping_proof_urls,
        );
      }

      const messages = await productRepository.getMessagesByOrderId(order.id);

      return {
        view: "vwProduct/complete-order",
        data: {
          product,
          order,
          paymentInvoice,
          shippingInvoice,
          messages,
          isSeller,
          isHighestBidder,
          currentUserId: userId,
        },
      };
    },

    async submitPayment({ orderId, userId, payload }) {
      const order = await productRepository.findOrderById(orderId);
      if (!order || order.buyer_id !== userId) {
        return { ok: false, status: 403, error: "Forbidden" };
      }

      const {
        payment_method,
        payment_proof_urls,
        note,
        shipping_address,
        shipping_phone,
      } = payload;

      await productRepository.createPaymentInvoice({
        order_id: orderId,
        issuer_id: userId,
        payment_method,
        payment_proof_urls,
        note,
      });

      await productRepository.updateOrderShippingInfo(orderId, {
        shipping_address,
        shipping_phone,
      });

      await productRepository.updateOrderStatus(
        orderId,
        "payment_submitted",
        userId,
      );
      return { ok: true };
    },

    async confirmPayment({ orderId, userId }) {
      const order = await productRepository.findOrderById(orderId);
      if (!order || order.seller_id !== userId) {
        return { ok: false, status: 403, error: "Forbidden" };
      }

      const paymentInvoice = await productRepository.getPaymentInvoice(orderId);
      if (!paymentInvoice) {
        return { ok: false, status: 404, error: "Payment invoice not found" };
      }

      await productRepository.verifyInvoice(paymentInvoice.id);
      await productRepository.updateOrderStatus(
        orderId,
        "payment_confirmed",
        userId,
      );
      return { ok: true };
    },

    async submitShipping({ orderId, userId, payload }) {
      const order = await productRepository.findOrderById(orderId);
      if (!order || order.seller_id !== userId) {
        return { ok: false, status: 403, error: "Forbidden" };
      }

      const { tracking_number, shipping_provider, shipping_proof_urls, note } =
        payload;

      await productRepository.createShippingInvoice({
        order_id: orderId,
        issuer_id: userId,
        tracking_number,
        shipping_provider,
        shipping_proof_urls,
        note,
      });

      await productRepository.updateOrderStatus(orderId, "shipped", userId);
      return { ok: true };
    },

    async confirmDelivery({ orderId, userId }) {
      const order = await productRepository.findOrderById(orderId);
      if (!order || order.buyer_id !== userId) {
        return { ok: false, status: 403, error: "Forbidden" };
      }
      await productRepository.updateOrderStatus(orderId, "delivered", userId);
      return { ok: true };
    },

    async submitOrderRating({ orderId, userId, rating, comment }) {
      const order = await productRepository.findOrderById(orderId);
      if (!order || (order.buyer_id !== userId && order.seller_id !== userId)) {
        return { ok: false, status: 403, error: "Forbidden" };
      }

      const isBuyer = order.buyer_id === userId;
      const reviewerId = userId;
      const revieweeId = isBuyer ? order.seller_id : order.buyer_id;
      const ratingValue = rating === "positive" ? 1 : -1;

      const existingReview = await productRepository.findByReviewerAndProduct(
        reviewerId,
        order.product_id,
      );

      if (existingReview) {
        await productRepository.updateByReviewerAndProduct(
          reviewerId,
          order.product_id,
          {
            rating: ratingValue,
            comment: comment || null,
          },
        );
      } else {
        await productRepository.createReview({
          reviewer_id: reviewerId,
          reviewed_user_id: revieweeId,
          product_id: order.product_id,
          rating: ratingValue,
          comment: comment || null,
        });
      }

      const buyerReview = await productRepository.getProductReview(
        order.buyer_id,
        order.seller_id,
        order.product_id,
      );
      const sellerReview = await productRepository.getProductReview(
        order.seller_id,
        order.buyer_id,
        order.product_id,
      );

      if (buyerReview && sellerReview) {
        await productRepository.updateOrderStatus(orderId, "completed", userId);
      }

      return { ok: true };
    },

    async completeTransactionSkip({ orderId, userId }) {
      const order = await productRepository.findOrderById(orderId);
      if (!order || (order.buyer_id !== userId && order.seller_id !== userId)) {
        return { ok: false, status: 403, error: "Forbidden" };
      }

      const isBuyer = order.buyer_id === userId;
      const reviewerId = userId;
      const revieweeId = isBuyer ? order.seller_id : order.buyer_id;

      const existingReview = await productRepository.findByReviewerAndProduct(
        reviewerId,
        order.product_id,
      );

      if (!existingReview) {
        await productRepository.createReview({
          reviewer_id: reviewerId,
          reviewed_user_id: revieweeId,
          product_id: order.product_id,
          rating: 0,
          comment: null,
        });
      }

      const buyerReview = await productRepository.getProductReview(
        order.buyer_id,
        order.seller_id,
        order.product_id,
      );
      const sellerReview = await productRepository.getProductReview(
        order.seller_id,
        order.buyer_id,
        order.product_id,
      );

      if (buyerReview && sellerReview) {
        await productRepository.updateOrderStatus(orderId, "completed", userId);
      }

      return { ok: true };
    },

    async sendOrderMessage({ orderId, userId, message }) {
      const order = await productRepository.findOrderById(orderId);
      if (!order || (order.buyer_id !== userId && order.seller_id !== userId)) {
        return { ok: false, status: 403, error: "Forbidden" };
      }

      await productRepository.sendMessage({
        order_id: orderId,
        sender_id: userId,
        message,
      });

      return { ok: true };
    },

    async getOrderMessages({ orderId, userId }) {
      const order = await productRepository.findOrderById(orderId);
      if (!order || (order.buyer_id !== userId && order.seller_id !== userId)) {
        return { ok: false, status: 403, error: "Forbidden" };
      }

      const messages = await productRepository.getMessagesByOrderId(orderId);
      return { ok: true, messages };
    },

    async rejectBidder({ productId, bidderId, sellerId }) {
      // Keep existing route semantics: do DB writes in a transaction.
      await productRepository.db.transaction(async (trx) => {
        const product = await trx("products").where("id", productId).first();
        if (!product) throw new Error("Product not found");
        if (product.seller_id !== sellerId)
          throw new Error("You do not have permission");

        await trx("rejected_bidders")
          .insert({ product_id: productId, bidder_id: bidderId, seller_id: sellerId })
          .onConflict(["product_id", "bidder_id"])
          .ignore();
      });

      return { ok: true };
    },

    async unrejectBidder({ productId, bidderId, sellerId }) {
      const product = await productRepository.findByProductId2(
        productId,
        sellerId,
      );
      if (!product) throw new Error("Product not found");
      if (product.seller_id !== sellerId) throw new Error("Unauthorized");

      const now = new Date();
      const endDate = new Date(product.end_at);
      if (product.is_sold !== null || endDate <= now || product.closed_at) {
        throw new Error("Cannot unreject for non-active product");
      }

      await productRepository.unrejectBidder(productId, bidderId);
      return { ok: true };
    },

    async buyNow({ productId, userId }) {
      await productRepository.db.transaction(async (trx) => {
        const product = await trx("products")
          .where("id", productId)
          .forUpdate()
          .first();

        if (!product) throw new Error("Product not found");
        if (!product.buy_now_price) throw new Error("Buy now not available");
        if (product.is_sold === true) throw new Error("Product already sold");

        const now = new Date();
        const endDate = new Date(product.end_at);
        if (now > endDate) throw new Error("This auction has ended");

        await trx("products").where("id", productId).update({
          current_price: product.buy_now_price,
          highest_bidder_id: userId,
          highest_max_price: product.buy_now_price,
          closed_at: new Date(),
        });

        await trx("bidding_history").insert({
          product_id: productId,
          bidder_id: userId,
          current_price: product.buy_now_price,
          is_buy_now: true,
          created_at: new Date(),
        });
      });

      return {
        ok: true,
        message:
          "Congratulations! You have successfully purchased the product at Buy Now price. Please proceed to payment.",
        redirectUrl: `/products/complete-order?id=${productId}`,
      };
    },

    async getSellerRatingsPage(sellerId) {
      const seller = await productRepository.findUserById(sellerId);
      if (!seller) return { notFound: true };

      const ratingData = await productRepository.calculateRatingPoint(sellerId);
      const rating_point = ratingData ? ratingData.rating_point : 0;
      const reviews = await productRepository.getReviewsByUserId(sellerId);

      const totalReviews = reviews.length;
      const positiveReviews = reviews.filter((r) => r.rating === 1).length;
      const negativeReviews = reviews.filter((r) => r.rating === -1).length;

      return {
        view: "vwProduct/seller-ratings",
        data: {
          sellerName: seller.fullname,
          rating_point,
          totalReviews,
          positiveReviews,
          negativeReviews,
          reviews,
        },
      };
    },

    async getBidderRatingsPage(bidderId) {
      const bidder = await productRepository.findUserById(bidderId);
      if (!bidder) return { notFound: true };

      const ratingData = await productRepository.calculateRatingPoint(bidderId);
      const rating_point = ratingData ? ratingData.rating_point : 0;
      const reviews = await productRepository.getReviewsByUserId(bidderId);

      const totalReviews = reviews.length;
      const positiveReviews = reviews.filter((r) => r.rating === 1).length;
      const negativeReviews = reviews.filter((r) => r.rating === -1).length;

      const maskedName = bidder.fullname
        ? bidder.fullname
          .split("")
          .map((char, index) => (index % 2 === 0 ? char : "*"))
          .join("")
        : "";

      return {
        view: "vwProduct/bidder-ratings",
        data: {
          bidderName: maskedName,
          rating_point,
          totalReviews,
          positiveReviews,
          negativeReviews,
          reviews,
        },
      };
    },
  };
}
