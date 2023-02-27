import { Test, TestingModule } from '@nestjs/testing';
import { EdvService } from './edv.service';
import { ConfigService } from '@nestjs/config';

describe('EdvService', () => {
  let service: EdvService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EdvService, ConfigService],
    }).compile();

    service = module.get<EdvService>(EdvService);
    const did = {
      '@context': ['https://www.w3.org/ns/did/v1'],
      id: 'did:hid:testnet:z28ScfSszr2zi2Bd7qmNE4mfHX5j8nCwx4DBF6nAUHu4p',
      controller: [
        'did:hid:testnet:z28ScfSszr2zi2Bd7qmNE4mfHX5j8nCwx4DBF6nAUHu4p',
      ],
      alsoKnownAs: [
        'did:hid:testnet:z28ScfSszr2zi2Bd7qmNE4mfHX5j8nCwx4DBF6nAUHu4p',
      ],
      verificationMethod: [
        {
          id: 'did:hid:testnet:z28ScfSszr2zi2Bd7qmNE4mfHX5j8nCwx4DBF6nAUHu4p#key-1',
          type: 'Ed25519VerificationKey2020',
          controller:
            'did:hid:testnet:z28ScfSszr2zi2Bd7qmNE4mfHX5j8nCwx4DBF6nAUHu4p',
          publicKeyMultibase: 'z28ScfSszr2zi2Bd7qmNE4mfHX5j8nCwx4DBF6nAUHu4p',
        },
      ],
      authentication: [
        'did:hid:testnet:z28ScfSszr2zi2Bd7qmNE4mfHX5j8nCwx4DBF6nAUHu4p#key-1',
      ],
      assertionMethod: [
        'did:hid:testnet:z28ScfSszr2zi2Bd7qmNE4mfHX5j8nCwx4DBF6nAUHu4p#key-1',
      ],
      keyAgreement: [
        'did:hid:testnet:z28ScfSszr2zi2Bd7qmNE4mfHX5j8nCwx4DBF6nAUHu4p#key-1',
      ],
      capabilityInvocation: [
        'did:hid:testnet:z28ScfSszr2zi2Bd7qmNE4mfHX5j8nCwx4DBF6nAUHu4p#key-1',
      ],
      capabilityDelegation: [
        'did:hid:testnet:z28ScfSszr2zi2Bd7qmNE4mfHX5j8nCwx4DBF6nAUHu4p#key-1',
      ],
      service: [],
    };
    const key = {
      privateKeyMultibase:
        'zrv3qUfaLMV8AJUkfVUJqNUn6C35bWbc2SAeXA2j29BfqZ7CdBjLxkzj1Ej13bb3S9VZn4fh8w7vq7szoC6bLiicrR2',
      publicKeyMultibase: 'z6MkfahfFh8SBaVB8gTpXLL4usDHLezzC6CJkE6Aw48VD7rC',
    };
    await service.setAuthenticationKey(
      key,
      did.authentication[0],
      did.controller[0],
    );
    await service.init('abc');
  });

  it('should be defined', async () => {
    expect(service).toBeDefined();
  });
});
