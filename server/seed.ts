import { prisma } from "./libs/prisma";

async function main() {
  await prisma.message.deleteMany();
  await prisma.lobbyMember.deleteMany();
  await prisma.lobby.deleteMany();
  await prisma.user.deleteMany();

  const admin = await prisma.user.create({
    data: {
      username: "admin",
      avatar: "https://example.com/admin.png",
      rank: "ACE",
    },
  });

  const lobby = await prisma.lobby.create({
    data: {
      code: "ADMIN01",
      title: "Admin Lobby",
      game: "PUBG_MOBILE",
      visibility: "PUBLIC",
      maxPlayers: 10,
    },
  });

  await prisma.lobbyMember.create({
    data: {
      userId: admin.id,
      lobbyId: lobby.id,
      role: "HOST",
    },
  });

  await prisma.message.create({
    data: {
      content: "Welcome to the admin lobby",
      userId: admin.id,
      lobbyId: lobby.id,
    },
  });

  console.log("Seed complete");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });