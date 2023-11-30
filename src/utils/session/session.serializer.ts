import { PassportSerializer } from '@nestjs/passport';

export class SessionSerializer extends PassportSerializer {
  // Not doing much here
  serializeUser(user: any, done: (a, b) => void) {
    done(null, user);
  }

  // Not doing much here
  deserializeUser(payload: any, done: (a, b) => void) {
    done(null, payload);
  }
}
