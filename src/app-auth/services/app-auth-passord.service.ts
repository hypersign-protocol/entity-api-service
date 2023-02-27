import { Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';
@Injectable()
export class AppAuthSecretService {
  async hashSecrets(secret: string): Promise<string> {
    const hashdSecret = await argon2.hash(secret);
    return hashdSecret;
  }

  async comapareSecret(secret: string, hash: string): Promise<boolean> {
    const isValid = await argon2.verify(hash, secret);
    return isValid;
  }
}
