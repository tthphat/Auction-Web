import * as productModel from './models/product.model.js';
import { createProductRepository } from './repositories/product.repository.js';
import { createHomeService } from './services/home.service.js';
import { createHomeController } from './controllers/home.controller.js';

// ========================== HOME =========================

const productRepository = createProductRepository(productModel);
const homeService = createHomeService({ productRepository });
export const homeController = createHomeController({ homeService });

// ===========================================================










