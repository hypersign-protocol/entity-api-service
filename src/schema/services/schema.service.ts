import { Injectable, NotFoundException } from '@nestjs/common';
import { DidRepository } from 'src/did/repository/did.repository';
import { EdvService } from '../../edv/services/edv.service';
import { HidWalletService } from '../../hid-wallet/services/hid-wallet.service';
import { CreateSchemaDto } from '../dto/create-schema.dto';
import { UpdateSchemaDto } from '../dto/update-schema.dto';
import { SchemaRepository } from '../repository/schema.repository';
import { SchemaSSIService } from './schema.ssi.service';

@Injectable()
export class SchemaService {
  constructor(
    private readonly didRepository: DidRepository,
    private readonly schemaService: SchemaService,
    private readonly schemaRepository: SchemaRepository,
    private readonly edvService: EdvService,
    private readonly hidWallet: HidWalletService,
    private readonly schemaSSSiService: SchemaSSIService,
  ) {}
  async create(createSchemaDto: CreateSchemaDto, appDetail) {
    const didInfo = await this.didRepository.findOne({
      appId: appDetail.appId,
      did: createSchemaDto.author, // check this did should be registered
    });
    if (!didInfo) {
      throw new NotFoundException([
        `No resource found for authorDid ${createSchemaDto.author}`,
      ]);
    }
    const { edvId, edvDocId } = appDetail;
    await this.edvService.init(edvId);
    const docs = await this.edvService.getDecryptedDocument(edvDocId);
    const mnemonic: string = docs.mnemonic;
    const hypersignSchema =
      await this.schemaSSSiService.initiateHypersignSchema(mnemonic);
    const schemaObject = await hypersignSchema.generate({ ...createSchemaDto });
    console.log(schemaObject);
    return schemaObject;
    // return 'This action adds a new schema';
  }

  findAll() {
    return `This action returns all schema`;
  }

  findOne(id: number) {
    return `This action returns a #${id} schema`;
  }

  update(id: number, updateSchemaDto: UpdateSchemaDto) {
    return `This action updates a #${id} schema`;
  }

  remove(id: number) {
    return `This action removes a #${id} schema`;
  }
}
