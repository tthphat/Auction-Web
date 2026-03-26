import * as productModel from "./models/product.model.js";
import * as reviewModel from "./models/review.model.js";
import * as productDescUpdateModel from "./models/productDescriptionUpdate.model.js";
import * as biddingHistoryModel from "./models/biddingHistory.model.js";
import * as productCommentModel from "./models/productComment.model.js";

import * as userModel from "./models/user.model.js";
import * as upgradeRequestModel from "./models/upgradeRequest.model.js";
import * as watchlistModel from "./models/watchlist.model.js";
import * as autoBiddingModel from "./models/autoBidding.model.js";

import { createProductRepository } from "./repositories/product.repository.js";
import { createSellerRepository } from "./repositories/seller.repository.js";
import { createAccountRepository } from "./repositories/account.repository.js";

import { createHomeService } from "./services/home.service.js";
import { createSellerService } from "./services/seller.service.js";
import { createAccountService } from "./services/account.service.js";

import { createHomeController } from "./controllers/home.controller.js";
import { createSellerController } from "./controllers/seller.controller.js";
import { createAccountController } from "./controllers/account.controller.js";

import { sendMail } from "./utils/mailer.js";

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

// ===========================================================
