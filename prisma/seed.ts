import { PrismaClient, Prisma } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter,
});

const userData: Prisma.UserCreateInput[] = [
  {
    email: "admin@veloura.lk",
    firstName: "Admin",
    lastName: "Veloura",
    password: "$2a$12$8OhPt81tYoUpeA/aKqaXVOk1rZQS8tmfM.fKL9aljlzWMagBCyw/2",
    role: "ADMIN",
    privileges: [],
  },
  
];

export async function main() {
  for (const u of userData) {
    await prisma.user.create({ data: u });
  }
}

main();