import {
  applyDecorators,
  SetMetadata,
  BadRequestException,
} from '@nestjs/common';

export const IsDid = (): PropertyDecorator => {
  return applyDecorators(
    SetMetadata('isDid', true),
    (target: object, propertyKey: string | symbol) => {
      let original = target[propertyKey];
      const descriptor: PropertyDescriptor = {
        get: () => original,
        set: (val: any) => {
          if (val.trim() === '') {
            throw new BadRequestException([
              `${propertyKey.toString()} cannot be empty`,
            ]);
          }

          const did = val;
          if (!did.includes('did:hid:')) {
            throw new BadRequestException([
              `Invalid ${propertyKey.toString()}`,
            ]);
          }
          if (did.includes('.')) {
            throw new BadRequestException([
              `Invalid ${propertyKey.toString()}`,
            ]);
          }
          original = val;
        },
      };
      Object.defineProperty(target, propertyKey, descriptor);
    },
  );
};

export const IsMethodSpecificId = (): PropertyDecorator => {
  return applyDecorators(
    SetMetadata('isMethodSpecificId', true),
    (target: object, propertyKey: string | symbol) => {
      let original = target[propertyKey];
      const descriptor: PropertyDescriptor = {
        get: () => original,
        set: (val: any) => {
          if (val.trim() === '') {
            throw new BadRequestException([
              `${propertyKey.toString()} cannot be empty`,
            ]);
          }

          const did = val;
          if (did.includes('did:hid:')) {
            throw new BadRequestException([
              `Invalid ${propertyKey.toString()}`,
            ]);
          }
          if (did.includes('hid')) {
            throw new BadRequestException([
              `Invalid ${propertyKey.toString()}`,
            ]);
          }
          if (did.includes(':')) {
            throw new BadRequestException([
              `Invalid ${propertyKey.toString()}`,
            ]);
          }
          if (did.includes('.')) {
            throw new BadRequestException([
              `Invalid ${propertyKey.toString()}`,
            ]);
          }
          original = val;
        },
      };
      Object.defineProperty(target, propertyKey, descriptor);
    },
  );
};
