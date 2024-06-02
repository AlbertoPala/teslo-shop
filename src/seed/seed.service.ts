import { Injectable } from '@nestjs/common';
import { ProductService } from '../product/product.service';
import { initialData } from './data/seed-data';
import { Repository } from 'typeorm';
import { User } from 'src/auth/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class SeedService {
  constructor(
    private readonly product: ProductService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async runSeed() {
    await this.deleteTable();
    const adminUser = await this.insertNewUsers();
    await this.insertNewProduct(adminUser);
    return `seed executed`;
  }

  private async deleteTable() {
    await this.product.deleteAllProduct();
    const quertBuilder = this.userRepository.createQueryBuilder();
    await quertBuilder.delete().where({}).execute();
  }

  private async insertNewUsers() {
    const seedUser = initialData.users;
    const users: User[] = [];
    seedUser.forEach((user) => {
      users.push(this.userRepository.create(user));
    });
    const dbUsers = await this.userRepository.save(seedUser);

    return dbUsers[0];
  }
  private async insertNewProduct(user: User) {
    await this.product.deleteAllProduct();
    const seedProduct = initialData.products;

    const insertPromises = [];
    seedProduct.forEach((product) => {
      insertPromises.push(this.product.create(product, user));
    });
    await Promise.all(insertPromises);
    return true;
  }
}
