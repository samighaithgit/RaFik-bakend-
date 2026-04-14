import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';
const isRunFromDist = __dirname.includes('dist');
const useCompiled = isProduction || isRunFromDist;

/**
 * TypeORM CLI data source for migrations.
 * Used by: npx typeorm-ts-node-commonjs migration:generate/run/revert
 */
export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'rafeeq_alkhalil',
  entities: [useCompiled ? 'dist/**/*.entity.js' : 'src/**/*.entity.ts'],
  migrations: [useCompiled ? 'dist/database/migrations/*.js' : 'src/database/migrations/*.ts'],
  synchronize: false,
  logging: !isProduction,
});
