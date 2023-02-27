import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { isURL } from 'class-validator';

@ValidatorConstraint({ name: 'isUrl' })
export class IsUrlValidator implements ValidatorConstraintInterface {
  validate(value: any) {
    if (!value || value.trim() == '') {
      return true;
    }
    if (
      value.startsWith('http://localhost') ||
      value.startsWith('https://localhost')
    ) {
      return true;
    }
    return isURL(value);
  }

  defaultMessage() {
    return '$property is not a valid URL';
  }
}

export function IsUrlEmpty(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsUrlValidator,
    });
  };
}
