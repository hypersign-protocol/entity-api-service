import {
  applyDecorators,
  SetMetadata,
  BadRequestException,
} from '@nestjs/common';
export const Trim = (): PropertyDecorator => {
  return applyDecorators(
    SetMetadata('notEmpty', true),
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
          original = val.trim();
        },
      };
      Object.defineProperty(target, propertyKey, descriptor);
    },
  );
};

export const IsEmptyTrim = (): PropertyDecorator => {
  return applyDecorators(
    SetMetadata('notEmpty', true),
    (target: object, propertyKey: string | symbol) => {
      let original = target[propertyKey];
      const descriptor: PropertyDescriptor = {
        get: () => original,
        set: (val: any) => {
          original = val.trim();
        },
      };
      Object.defineProperty(target, propertyKey, descriptor);
    },
  );
};
