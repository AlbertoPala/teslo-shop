import { Injectable } from '@nestjs/common';
import { ProductService } from '../product/product.service';
import { initialData } from './data/seed-data';

@Injectable()
export class SeedService {
  constructor(private readonly product: ProductService) {}

  runSeed() {
    this.insertNewProduct();
    return `seed executed`;
  }

  private async insertNewProduct() {
    await this.product.deleteAllProduct();
    const seedProduct = initialData.products;

    const insertPromises = [];
    seedProduct.forEach((product) => {
      insertPromises.push(this.product.create(product));
    });
    await Promise.all(insertPromises);
    return true;
  }
}
