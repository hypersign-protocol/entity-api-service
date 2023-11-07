import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { existDir, createDir, store } from './utils/utils';
import { HypersignSSISdk } from 'hs-ssi-sdk';
import { json, urlencoded } from 'express';
import * as path from 'path';
import * as express from 'express';
// eslint-disable-next-line
const hidWallet = require('hid-hd-wallet');
import { Bip39, EnglishMnemonic } from '@cosmjs/crypto';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EdvClientKeysManager } from './edv/services/edv.singleton';
import { VaultWalletManager } from './edv/services/vaultWalletManager';
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

  // HID SDK instance
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
  globalThis.hsSSIdkInstance = hsSSIdkInstance;

  const mnemonic_EnglishMnemonic: EnglishMnemonic = process.env
    .MNEMONIC as unknown as EnglishMnemonic;

  const kmsVaultWallet = await VaultWalletManager.getWallet(
    mnemonic_EnglishMnemonic,
  );

  app.setGlobalPrefix('api/v1');
  if (!existDir(process.env.EDV_CONFIG_DIR)) {
    createDir(process.env.EDV_CONFIG_DIR);
  }
  if (!existDir(process.env.EDV_DID_FILE_PATH)) {
    store(kmsVaultWallet.didDocument, process.env.EDV_DID_FILE_PATH);
  }
  if (!existDir(process.env.EDV_KEY_FILE_PATH)) {
    store(kmsVaultWallet.keys, process.env.EDV_KEY_FILE_PATH);
  }

  try {
    Logger.log('Before keymanager initialization');
    const kmsVaultManager = new EdvClientKeysManager();
    const config = new ConfigService();
    const vaultPrefixInEnv = config.get('VAULT_PREFIX');
    const vaultPrefix =
      vaultPrefixInEnv && vaultPrefixInEnv != 'undefined'
        ? vaultPrefixInEnv
        : 'hs:studio-api:';
    const edvId = vaultPrefix + 'kms:' + kmsVaultWallet.didDocument.id;
    const kmsVault = await kmsVaultManager.createVault(kmsVaultWallet, edvId);

    // TODO rename this to kmsVault for bnetter cla
    globalThis.kmsVault = kmsVault;

    // const message = {
    //   status: 'succes',
    //   mnemonic: '1231 123123 123123 123',
    // }
    // const edvDocToInsert = VaultKeysManager.prepareEdvDocument(message, [{ index: 'content.status', unique: true }])
    // Logger.log(edvDocToInsert)
    // const docID = await VaultKeysManager.insertDocument(edvDocToInsert)
    // Logger.log(docID)

    // return docID

    Logger.log('After  keymanager initialization');
  } catch (e) {
    console.log(e);
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
  const options = {
    swaggerOptions: {
      defaultModelsExpandDepth: -1,
    },
    customfavIcon: '/Entity_favicon.png',
    customSiteTitle: 'API-Playground',
    customCss: ` .topbar-wrapper img {content:url(\'./Entity_full.png\'); width:135px; height:auto;margin-left: -150px;}
    .swagger-ui .topbar { background-color: #fff; }`,
  };
  SwaggerModule.setup('api', app, document, options);
  await app.listen(process.env.PORT || 3001);
  Logger.log(
    `Server running on http://localhost:${process.env.PORT}`,
    'Bootstrap',
  );
}
bootstrap();
