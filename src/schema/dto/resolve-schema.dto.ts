import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

class Proof {
  @ApiProperty({
    name: 'type',
    description: 'Key type to generate  credential',
    example: 'Ed25519VerificationKey2020',
  })
  type: string;
  @ApiProperty({
    name: 'created',
    description: 'Time of schema creation ',
    example: '2023-01-24T14:35:53Z',
  })
  created: string;
  @ApiProperty({
    name: 'verificationMethod',
    description: 'Verification Method id',
    example: 'did:hid:testnet:..............',
  })
  verificationMethod: string;
  @ApiProperty({
    name: 'proofPurpose',
    description: 'Purpose of proof ',
    example: 'assertion',
  })
  proofPurpose: string;
  @ApiProperty({
    name: 'proofValue',
    description: 'proof value ',
    example: '8jKQBTUnY2k5n2rNFwuI.....Jyyco6uYJtG7HM4ojnmwUCa.....',
  })
  proofValue: string;
}

class schemaDetail {
  @ApiProperty({
    name: 'schema',
    description: 'schema url ',
    example: 'http://json-schema.org/draft-07/schema',
  })
  schema: string;
  @ApiProperty({
    name: 'description',
    description: 'Short description of schema',
    example: 'schema for railway ticket',
  })
  description: string;
  @ApiProperty({
    name: 'type',
    description: 'Data type',
    example: 'object',
  })
  type: string;
  @ApiProperty({
    name: 'properties',
    description: 'all the configure field in schema ',
    example: 'schema for railway ticket',
  })
  properties: string;
  @ApiProperty({
    name: 'required',
    description: 'list of required attributes',
    example: [],
  })
  required: string[];
  @ApiProperty({
    name: 'additionalProperties',
    description: 'If set to true then we can add extra properties',
    example: true,
  })
  @IsBoolean()
  additionalProperties: boolean;
}
export class ResolveSchema {
  @ApiProperty({
    name: 'type',
    description: 'type ',
    example:
      'https://w3c-ccg.github.io/vc-json-schemas/v1/schema/1.0/schema.json',
  })
  type: string;
  @ApiProperty({
    name: 'modelVersion',
    description: 'version of model ',
    example: '1.0',
  })
  modelVersion: string;
  @ApiProperty({
    name: 'id',
    description: 'schema id ',
    example: 'sh:his:testnet:.................',
  })
  id: string;

  @ApiProperty({
    name: 'name',
    description: 'name of the schema ',
    example: 'schema for railway ticket',
  })
  name: string;
  @ApiProperty({
    name: 'author',
    description: 'issuer did ',
    example: 'did:hid:testnet:..........',
  })
  author: string;
  @ApiProperty({
    name: 'authored',
    description: 'Time of schema creation ',
    example: '2023-01-24T14:35:53Z',
  })
  authored: string;

  @ApiProperty({
    name: 'Schema',
    description: 'Resolved schema Document',
    example: schemaDetail,
  })
  schema: Partial<schemaDetail>;
  @ApiProperty({
    name: 'proof',
    description: 'proof of schema',
    example: Proof,
  })
  proof: Partial<Proof>;
}
