import * as productModel from "./models/product.model.js";
import * as reviewModel from "./models/review.model.js";
import * as productDescUpdateModel from "./models/productDescriptionUpdate.model.js";
import * as biddingHistoryModel from "./models/biddingHistory.model.js";
import * as productCommentModel from "./models/productComment.model.js";

import { createProductRepository } from "./repositories/product.repository.js";
import { createSellerRepository } from "./repositories/seller.repository.js";

import { createHomeService } from "./services/home.service.js";
import { createSellerService } from "./services/seller.service.js";

import { createHomeController } from "./controllers/home.controller.js";
import { createSellerController } from "./controllers/seller.controller.js";

// ========================== HOME =========================

const productRepository = createProductRepository(productModel);
const homeService = createHomeService({ productRepository });
export const homeController = createHomeController({ homeService });

// ========================== SELLER =========================

const sellerRepository = createSellerRepository({
  productModel,
  reviewModel,
  productDescUpdateModel,
  biddingHistoryModel,
  productCommentModel,
});
const sellerService = createSellerService({ sellerRepository });
export const sellerController = createSellerController({ sellerService });

// ===========================================================
