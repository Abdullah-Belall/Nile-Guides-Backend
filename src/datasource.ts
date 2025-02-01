import { DataSource } from 'typeorm';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'postgres',
  password: 'postgres',
  database: 'guide',
  entities: [
    __dirname + '/entities/*.entity.{js,ts}',
    __dirname + '/clients/entities/*.entity.{js,ts}',
    __dirname + '/workers/entities/*.entity.{js,ts}',
    __dirname + '/dashboard/entities/*.entity.{js,ts}',
  ],
  migrations: [__dirname + '/migrations/*.{js,ts}'],
  synchronize: false,
});
