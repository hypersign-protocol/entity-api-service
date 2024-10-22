import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';
import { IKeyType } from 'hs-ssi-sdk';

export function IsKeyTypeArrayOrSingle(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isValidKeyType',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const ecdsaTypes = [
            IKeyType.EcdsaSecp256k1RecoveryMethod2020,
            IKeyType.EcdsaSecp256k1VerificationKey2019,
          ];

          // Ensure value is either a single string or an array
          const values = Array.isArray(value) ? value : [value];
          const invalidKeyTypes = values.filter(
            (val) => !Object.values(IKeyType).includes(val),
          );
          // Ensure each value is part of the IKeyType enum
          if (invalidKeyTypes.length > 0) {
            (args as any).invalidKeyTypes = invalidKeyTypes; // Pass invalid key types for custom message
            return false;
          }

          // Check for ECDSA-specific validation rules
          const containsEcdsa = values.some((type) =>
            ecdsaTypes.includes(type),
          );
          const containsOthers = values.some(
            (type) => !ecdsaTypes.includes(type),
          );

          // ECDSA types must not be mixed with other types
          if (containsEcdsa && containsOthers) {
            return false;
          }

          // There must be no more than one ECDSA type
          if (
            containsEcdsa &&
            values.filter((type) => ecdsaTypes.includes(type)).length > 1
          ) {
            (args as any).multipleEcdsa = true; // Flag for multiple ECDSA error message
            return false;
          }

          return true;
        },
        defaultMessage(args: ValidationArguments) {
          // Check for the error flags set during validation and customize the message accordingly
          if ((args as any).invalidKeyTypes) {
            return `The provided key types ${JSON.stringify(
              (args as any).invalidKeyTypes,
            )} are invalid.`;
          }

          if ((args as any).mixingEcdsa) {
            return 'ECDSA key types must not be mixed with other key types.';
          }

          if ((args as any).multipleEcdsa) {
            return 'Only one ECDSA key type is allowed.';
          }

          return 'The provided key types are invalid. They must be one of the supported types, and ECDSA types must be used exclusively without mixing with other types.';
        },
      },
    });
  };
}
