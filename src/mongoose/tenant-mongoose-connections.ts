import * as mongoose from 'mongoose';
import { Connection } from 'mongoose';
import { REQUEST } from '@nestjs/core';
import { Scope, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export const databaseProviders = [
  {
    provide: 'APPDATABASECONNECTIONS',
    scope: Scope.REQUEST,
    useFactory: async (
      request: Request,
      config: ConfigService,
    ): Promise<Connection> => {
      Logger.log(
        'Db connection database provider',
        'tenant-mongoose-connections',
      );
      const connections: Connection[] = mongoose.connections;
      Logger.log(
        'Number of open connections: ' + connections.length,
        'tenant-mongoose-connections',
      );
      const subdomain = request['user']['subdomain'];
      const tenantDB: string =
        subdomain +
        '_' +
        (config.get('SERVICE_SUFFIX')
          ? config.get('SERVICE_SUFFIX')
          : 'SSIdb');


      // // Find existing connection
      const foundConn = connections.find((con: Connection) => {
        return con.name === tenantDB;
      });

      // Return the same connection if it exist
      if (foundConn && foundConn.readyState === 1) {
        Logger.log(
          'Found connection tenantDB = ' + tenantDB,
          'tenant-mongoose-connections',
        );
        return foundConn;
      } else {
        Logger.log(
          'No connection found for tenantDB = ' + tenantDB,
          'tenant-mongoose-connections',
        );
      }

      // TODO: take this from env using configService
      const BASE_DB_PATH = config.get('BASE_DB_PATH');
      const CONFIG_DB = config.get('DB_CONFIG');
      if (!BASE_DB_PATH) {
        throw new Error('No BASE_DB_PATH set in env');
      }

      const uri = `${BASE_DB_PATH}/${tenantDB}${CONFIG_DB}`;
      Logger.log(
        'Before creating new db connection...',
        'tenant-mongoose-connections',
      );
      const newConnectionPerApp = await mongoose.createConnection(uri);

      newConnectionPerApp.on('disconnected', () => {
        Logger.log(
          'DB connection ' + newConnectionPerApp.name + ' is disconnected',
          'tenant-mongoose-connections',
        );
      });
      return newConnectionPerApp;
    },
    inject: [REQUEST, ConfigService],
  },
];
