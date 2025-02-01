// import { DataSource } from 'typeorm';
// import { WorkersEntity } from './workers/entities/worker.entity';
// import { BusinessEntity } from './workers/entities/business.entity';
// import { faker } from '@faker-js/faker';

// const dataSource = new DataSource({
//   type: 'postgres',
//   host: 'localhost',
//   port: 5432,
//   username: 'postgres',
//   password: 'postgres',
//   database: 'guide',
//   entities: [
//     __dirname + '/entities/*.entity.{js,ts}',
//     __dirname + '/clients/entities/*.entity.{js,ts}',
//     __dirname + '/workers/entities/*.entity.{js,ts}',
//     __dirname + '/dashboard/entities/*.entity.{js,ts}',
//   ],
//   migrations: [__dirname + '/migrations/*.{js,ts}'],
//   synchronize: false,
// });

// async function seedDatabase() {
//   await dataSource.initialize();
//   console.log('Connected to the database.');
//   const workersRepository = dataSource.getRepository(WorkersEntity);
//   const businessRepository = dataSource.getRepository(BusinessEntity);
//   const WORKERS_COUNT = 5;
//   const MAX_BUSINESSES_PER_WORKER = 3;

//   for (let i = 0; i < WORKERS_COUNT; i++) {
//     const worker = workersRepository.create({
//       worker_id: faker.string.uuid(),
//       first_name: faker.person.firstName(),
//       last_name: faker.person.lastName(),
//       email: faker.internet.email(),
//       age: faker.number.int({ min: 18, max: 60 }),
//       avatar: faker.image.avatar(),
//       gender: faker.helpers.arrayElement(['MALE', 'FEMALE']),
//       state: faker.helpers.arrayElement(['ACTIVE', 'INACTIVE']),
//       role: 'worker',
//       password: faker.internet.password(),
//       created_at: faker.date.past(),
//       updated_at: faker.date.recent(),
//     });

//     await workersRepository.save(worker);

//     const businessCount = faker.number.int({
//       min: 1,
//       max: MAX_BUSINESSES_PER_WORKER,
//     });

//     for (let j = 0; j < businessCount; j++) {
//       const business = businessRepository.create({
//         title: faker.company.name(),
//         description: faker.lorem.sentence(),
//         language: faker.helpers.arrayElement(['English', 'French', 'Spanish']),
//         language_level: faker.helpers.arrayElement([
//           'BEGINNER',
//           'INTERMEDIATE',
//           'ADVANCED',
//         ]),
//         state: faker.location.state(),
//         price: faker.number.int({ min: 100, max: 1000 }),
//         image: faker.image.urlLoremFlickr({ category: 'business' }),
//         rate: faker.number.float({ min: 2, max: 10 }),
//         raters_counter: faker.number.int({ min: 0, max: 100 }),
//         admin_accept: faker.helpers.arrayElement(['pending', 'done']),
//         created_at: faker.date.past(),
//         updated_at: faker.date.recent(),
//         worker: worker,
//       });

//       await businessRepository.save(business);
//     }
//   }

//   console.log('Seeding completed.');
//   await dataSource.destroy();
// }

// // استدعاء وظيفة الإضافة
// seedDatabase().catch((error) => {
//   console.error('Error seeding the database:', error);
// });
