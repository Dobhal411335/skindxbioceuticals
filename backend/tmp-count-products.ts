import { PrismaClient } from "@prisma/client";

async function main() {
  const prisma = new PrismaClient();
  const sites = await prisma.site.findMany({ select: { code: true, id: true } });
  const grouped = await prisma.product.groupBy({
    by: ["siteId", "status"],
    _count: { _all: true },
  });
  console.log(JSON.stringify({ sites, grouped }, null, 2));
  await prisma.$disconnect();
}

void main();
