import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { existDir, createDir, store } from './utils/utils';
import { HypersignSSISdk } from 'hs-ssi-sdk';
import { json, urlencoded } from 'express';
import * as path from 'path';
import * as express from 'express';
import * as fs from 'fs';
process.chdir(__dirname);
// eslint-disable-next-line
const hidWallet = require('hid-hd-wallet');
import { Bip39, EnglishMnemonic } from '@cosmjs/crypto';
//import { Header } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });
  app.use(json({ limit: '10mb' }));
  app.use(urlencoded({ extended: true, limit: '10mb' }));
  app.use(express.static(path.join(__dirname, '../public')));
  // Adding prefix to our api

  const walletOptions = {
    hidNodeRestUrl: process.env.HID_NETWORK_API,
    hidNodeRPCUrl: process.env.HID_NETWORK_RPC,
  };
  const hidWalletInstance = new hidWallet(walletOptions);
  await hidWalletInstance.generateWallet({
    mnemonic: process.env.MNEMONIC,
  });
  const offlineSigner = hidWalletInstance.offlineSigner;
  const nodeRpcEndpoint = walletOptions.hidNodeRPCUrl;
  const nodeRestEndpoint = walletOptions.hidNodeRestUrl;
  const namespace = 'testnet';
  const hsSSIdkInstance = new HypersignSSISdk({
    offlineSigner,
    nodeRpcEndpoint,
    nodeRestEndpoint,
    namespace,
  });
  await hsSSIdkInstance.init();
  const mnemonic_EnglishMnemonic: EnglishMnemonic = process.env
    .MNEMONIC as unknown as EnglishMnemonic;
  const seedEntropy = Bip39.decode(mnemonic_EnglishMnemonic);
  const keys = await hsSSIdkInstance.did.generateKeys({ seed: seedEntropy });
  const edvDid = await hsSSIdkInstance.did.generate({
    publicKeyMultibase: keys.publicKeyMultibase,
  });
  app.setGlobalPrefix('api/v1');
  if (!existDir(process.env.EDV_CONFIG_DIR)) {
    createDir(process.env.EDV_CONFIG_DIR);
  }
  if (!existDir(process.env.EDV_DID_FILE_PATH)) {
    store(edvDid, process.env.EDV_DID_FILE_PATH);
  }
  if (!existDir(process.env.EDV_KEY_FILE_PATH)) {
    store(keys, process.env.EDV_KEY_FILE_PATH);
  }
  const config = new DocumentBuilder()
    .setTitle('Entity Studio SSI API Playground')
    .setDescription('Open API Documentation of the Entity Studio')
    .addBearerAuth(
      {
        type: 'http',
        name: 'Authorization',
        in: 'header',
      },
      'Authorization',
    )

    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);

  const swaggerOptions = {
    customCss: ` .topbar-wrapper img {content:url(\'./Entity_full.png\'); width:135px; height:auto;margin-left: 20px;}
    .swagger-ui .topbar { background-color: #905ab0; }`,
  };
  SwaggerModule.setup('api', app, document, swaggerOptions);
  await app.listen(process.env.PORT || 3001);
}
bootstrap();
