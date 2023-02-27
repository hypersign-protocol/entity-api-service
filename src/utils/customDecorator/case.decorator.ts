import {
  applyDecorators,
  BadRequestException,
  SetMetadata,
} from '@nestjs/common';

declare global {
  interface String {
    toPascalCase(): string;
    toSnakeCase(): string;
  }
}

String.prototype.toPascalCase = function () {
  return this.replace(new RegExp(/[-_]+/, 'g'), ' ')
    .replace(new RegExp(/[^\w\s]/, 'g'), '')
    .replace(
      new RegExp(/\s+(.)(\w*)/, 'g'),
      ($1, $2, $3) => `${$2.toUpperCase() + $3}`,
    )
    .replace(new RegExp(/\w/), (s) => s.toUpperCase());
};

String.prototype.toSnakeCase = function () {
  return this.split(' ')
    .map((character) => {
      if (character == character.toUpperCase()) {
        return '_' + character.toLowerCase();
      } else {
        return character;
      }
    })
    .join('');
};

export const ToPascalCase = (): PropertyDecorator => {
  return applyDecorators(
    SetMetadata('toPascalCase', true),
    (target: object, propertyKey: string | symbol) => {
      let original = target[propertyKey];
      const descriptor: PropertyDescriptor = {
        get: () => original,
        set: (val: string) => {
          original = val.toPascalCase();
        },
      };
      Object.defineProperty(target, propertyKey, descriptor);
    },
  );
};

export const ToSnakeCase = (): PropertyDecorator => {
  return applyDecorators(
    SetMetadata('toSnakeCase', true),
    (target: object, propertyKey: string | symbol) => {
      let original = target[propertyKey];
      const descriptor: PropertyDescriptor = {
        get: () => original,
        set: (val: string) => {
          if (val.trim() === '') {
            throw new BadRequestException([
              `${propertyKey.toString()} cannot be empty`,
            ]);
          }
          original = val.toSnakeCase();
        },
      };
      Object.defineProperty(target, propertyKey, descriptor);
    },
  );
};

export {};
