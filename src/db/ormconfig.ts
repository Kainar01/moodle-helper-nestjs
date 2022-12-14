/* eslint-disable import/no-extraneous-dependencies */
/// <reference types="../../typings/global" />
import * as dotenv from 'dotenv';
import { DataSource, DataSourceOptions, InstanceChecker } from 'typeorm';
import path from 'path';
import { configuration } from '../config/configuration';

dotenv.config({ path: path.join(__dirname, '../../.env') });

//#region typeorm hack
// https://github.com/typeorm/typeorm/issues/8914#issuecomment-1152603148
function patchAsyncDataSourceSetup(): void {
  const oldIsDataSource = InstanceChecker.isDataSource;
  InstanceChecker.isDataSource = function (obj: unknown): obj is DataSource {
    if (obj instanceof Promise) {
      return true;
    }
    return oldIsDataSource(obj);
  };
}
patchAsyncDataSourceSetup();
//#endregion

const ormconfig = async (): Promise<DataSource> => {
  const config = <{ db: DataSourceOptions }>await configuration();

  return new DataSource(config.db);
};

// eslint-disable-next-line import/no-default-export
export default ormconfig();
