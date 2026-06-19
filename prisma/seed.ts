import 'dotenv/config';
import { randomUUID } from 'crypto';
import * as bcrypt from 'bcrypt';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '../src/generated/prisma/client';

const DEFAULT_USERNAME = 'aukai';
const DEFAULT_PASSWORD = 'aukai2810';
const DEFAULT_NAME = 'Aukai Admin';

async function main(): Promise<void> {
  const adapter = new PrismaMariaDb({
    host: process.env.DATABASE_HOST,
    port: Number(process.env.DATABASE_PORT),
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
    connectionLimit: 5,
  });

  const prisma = new PrismaClient({ adapter });
  const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  const existingUser = await prisma.user.findUnique({
    where: { username: DEFAULT_USERNAME },
  });

  if (existingUser) {
    await prisma.user.update({
      where: { username: DEFAULT_USERNAME },
      data: {
        name: DEFAULT_NAME,
        password: hashedPassword,
      },
    });
    console.log(`User "${DEFAULT_USERNAME}" updated successfully.`);
  } else {
    await prisma.user.create({
      data: {
        id: randomUUID(),
        name: DEFAULT_NAME,
        username: DEFAULT_USERNAME,
        password: hashedPassword,
      },
    });
    console.log(`User "${DEFAULT_USERNAME}" created successfully.`);
  }

  await prisma.$disconnect();
}

main().catch((error: unknown) => {
  console.error('Seeding failed:', error);
  process.exit(1);
});
