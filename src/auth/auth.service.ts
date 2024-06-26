import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { LoginUserDto } from './dto/login-user.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}
  async create(createUserDto: CreateUserDto) {
    try {
      const { password, ...userData } = createUserDto;
      const user = this.userRepository.create({
        ...userData,
        password: bcrypt.hashSync(password, 10),
      });
      await this.userRepository.save(user);
      delete user.password;

      return { ...user, token: this.getJWT({ id: user.id }) };
    } catch (error) {
      this.handleDBError(error);
    }
  }
  //=========================================================================
  async login(loginUserDto: LoginUserDto) {
    const { password, email } = loginUserDto;
    const user = await this.userRepository.findOne({
      where: { email },
      select: { email: true, password: true, id: true },
    });
    if (!user) throw new UnauthorizedException('email migth be wrong');
    if (!bcrypt.compareSync(password, user.password))
      throw new UnauthorizedException('password migth be wrong');
    return { ...user, token: this.getJWT({ id: user.id }) };
  }
  async checkAuthStatus(user: User) {
    return { ...user, token: this.getJWT({ id: user.id }) };
  }
  //=========================================================================
  private getJWT(payload: JwtPayload) {
    const token = this.jwtService.sign(payload);
    return token;
  }
  //=========================================================================
  private handleDBError(error: any): never {
    if (error.code === '23505') throw new BadRequestException(error.detail);
    console.log(error);
    throw new InternalServerErrorException('please check server errors');
  }
}
