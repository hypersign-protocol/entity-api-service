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
      Logger.log('Db connection database provider', 'database-provider');
      const connections: Connection[] = mongoose.connections;
      const subdomain = request['user']['subdomain'];
      const tenantDB: string = subdomain;

      // Find existing connection
      const foundConn = connections.find((con: Connection) => {
        return con.name === tenantDB;
      });

      // Return the same connection if it exist
      if (foundConn && foundConn.readyState === 1) {
        return foundConn;
      }

      // TODO: take this from env using configService
      const BASE_DB_PATH = config.get('BASE_DB_PATH');
      if (!BASE_DB_PATH) {
        throw new Error('No BASE_DB_PATH set in env');
      }
      const uri = `${BASE_DB_PATH}/${subdomain}?retryWrites=true&w=majority`;

      Logger.log('Before creating new db connection...');
      const newConnectionPerApp = mongoose.createConnection(uri);

      newConnectionPerApp.on('disconnected', () => {
        Logger.log(
          'DB connection ' + newConnectionPerApp.name + ' is disconnected',
        );
      });
      // Delte this connection after sometime 10 min
      // We need to deal with this later.
      // setTimeout(() =>{
      //     Logger.log('setime out executed...');
      //     newConnectionPerApp.close()
      // }, 10000)

      return newConnectionPerApp;
    },
    inject: [REQUEST, ConfigService],
  },
];
