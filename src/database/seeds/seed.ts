import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as bcrypt from 'bcrypt';
import { Department } from '../../departments/entities/department.entity';
import { User } from '../../users/entities/user.entity';
import { DepartmentType } from '../../common/enums/department-type.enum';
import { Role } from '../../common/enums/role.enum';

dotenv.config();

const departments = [
  {
    name: 'Electricity Department',
    code: 'ELECTRICITY',
    type: DepartmentType.UTILITIES,
    description: 'Handles electrical infrastructure, street lighting, and power-related issues',
  },
  {
    name: 'Water Department',
    code: 'WATER',
    type: DepartmentType.UTILITIES,
    description: 'Manages water supply, pipes, leaks, and water infrastructure',
  },
  {
    name: 'Sewage Department',
    code: 'SEWAGE',
    type: DepartmentType.INFRASTRUCTURE,
    description: 'Handles sewage systems, drainage, and wastewater infrastructure',
  },
  {
    name: 'Roads Department',
    code: 'ROADS',
    type: DepartmentType.INFRASTRUCTURE,
    description: 'Manages roads, sidewalks, potholes, and road infrastructure',
  },
  {
    name: 'Sanitation Department',
    code: 'SANITATION',
    type: DepartmentType.ENVIRONMENTAL,
    description: 'Handles waste collection, garbage, and public cleanliness',
  },
  {
    name: 'Environment Department',
    code: 'ENVIRONMENT',
    type: DepartmentType.ENVIRONMENTAL,
    description: 'Manages environmental issues, visual pollution, and green spaces',
  },
];

async function seed() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE || 'rafeeq_alkhalil',
    entities: ['src/**/*.entity.ts'],
    synchronize: false,
  });

  await dataSource.initialize();
  console.log('Database connected for seeding.');

  const deptRepo = dataSource.getRepository(Department);
  const userRepo = dataSource.getRepository(User);

  // Seed departments
  for (const dept of departments) {
    const existing = await deptRepo.findOne({ where: { code: dept.code } });
    if (!existing) {
      await deptRepo.save(deptRepo.create(dept));
      console.log(`  Created department: ${dept.name}`);
    } else {
      console.log(`  Department already exists: ${dept.name}`);
    }
  }

  // Seed super admin
  const adminEmail = 'admin@hebron.ps';
  const existingAdmin = await userRepo.findOne({ where: { email: adminEmail } });
  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash('Admin@Hebron2026', 12);
    await userRepo.save(
      userRepo.create({
        fullName: 'System Administrator',
        email: adminEmail,
        phoneNumber: '+970222228888',
        passwordHash,
        role: Role.SUPER_ADMIN,
      }),
    );
    console.log('  Created super admin: admin@hebron.ps');
  } else {
    console.log('  Super admin already exists.');
  }

  // Seed a test citizen
  const citizenEmail = 'citizen@example.com';
  const existingCitizen = await userRepo.findOne({ where: { email: citizenEmail } });
  if (!existingCitizen) {
    const passwordHash = await bcrypt.hash('Citizen@123', 12);
    await userRepo.save(
      userRepo.create({
        fullName: 'Ahmad Citizen',
        email: citizenEmail,
        phoneNumber: '+970599111222',
        passwordHash,
        role: Role.CITIZEN,
      }),
    );
    console.log('  Created test citizen: citizen@example.com');
  } else {
    console.log('  Test citizen already exists.');
  }

  console.log('\nSeed completed successfully.');
  await dataSource.destroy();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
