import * as productModel from "./models/product.model.js";
import * as reviewModel from "./models/review.model.js";
import * as productDescUpdateModel from "./models/productDescriptionUpdate.model.js";
import * as biddingHistoryModel from "./models/biddingHistory.model.js";
import * as productCommentModel from "./models/productComment.model.js";

import * as userModel from "./models/user.model.js";
import * as upgradeRequestModel from "./models/upgradeRequest.model.js";
import * as watchlistModel from "./models/watchlist.model.js";
import * as autoBiddingModel from "./models/autoBidding.model.js";
import * as categoryModel from "./models/category.model.js";
import * as productCommentModel from "./models/productComment.model.js";
import * as productDescriptionUpdateModel from "./models/productDescriptionUpdate.model.js";
import * as systemSettingModel from "./models/systemSetting.model.js";
import * as rejectedBidderModel from "./models/rejectedBidder.model.js";
import * as orderModel from "./models/order.model.js";
import * as invoiceModel from "./models/invoice.model.js";
import * as orderChatModel from "./models/orderChat.model.js";

import { createProductRepository } from "./repositories/product.repository.js";
import { createSellerRepository } from "./repositories/seller.repository.js";
import { createAccountRepository } from "./repositories/account.repository.js";
import { createProductPublicRepository } from "./repositories/productPublic.repository.js";

import { createHomeService } from "./services/home.service.js";
import { createSellerService } from "./services/seller.service.js";
import { createAccountService } from "./services/account.service.js";
import { createProductPublicService } from "./services/productPublic.service.js";

import { createHomeController } from "./controllers/home.controller.js";
import { createSellerController } from "./controllers/seller.controller.js";
import { createAccountController } from "./controllers/account.controller.js";
import { createProductPublicController } from "./controllers/productPublic.controller.js";

import { sendMail } from "./utils/mailer.js";
import db from "./utils/db.js";

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

// ========================== ACCOUNT =========================

const accountRepository = createAccountRepository({
  userModel,
  upgradeRequestModel,
  watchlistModel,
  reviewModel,
  autoBiddingModel,
});
const accountService = createAccountService({
  accountRepository,
  mailer: { sendMail },
});
export const accountController = createAccountController({
  accountService,
  accountRepository,
});

// ========================== PRODUCT (PUBLIC) =========================

const productPublicRepository = createProductPublicRepository({
  productModel,
  reviewModel,
  userModel,
  watchListModel: watchlistModel,
  biddingHistoryModel,
  productCommentModel,
  categoryModel,
  productDescUpdateModel: productDescriptionUpdateModel,
  systemSettingModel,
  rejectedBidderModel,
  orderModel,
  invoiceModel,
  orderChatModel,
  autoBiddingModel,
  db,
});

const productPublicService = createProductPublicService({
  productRepository: productPublicRepository,
  mailer: { sendMail },
});

export const productPublicController = createProductPublicController({
  productService: productPublicService,
});

// ===========================================================
