import { prisma } from "./libs/prisma.js";

async function main() {
  console.log("Seeding database...\n");

  await prisma.message.deleteMany();
  await prisma.lobbyMember.deleteMany();
  await prisma.lobby.deleteMany();
  await prisma.user.deleteMany();

  const yojjal = await prisma.user.create({
    data: {
      username: "Yojjal",
      avatar: null,
    },
  });

  const gamer42 = await prisma.user.create({
    data: {
      username: "Gamer42",
      avatar: null,
    },
  });

  const proPlayer = await prisma.user.create({
    data: {
      username: "ProPlayer",
      avatar: null,
    },
  });

  const nightOwl = await prisma.user.create({
    data: {
      username: "NightOwl",
      avatar: null,
    },
  });

  console.log("  Created 4 users");

  const pubgLobby = await prisma.lobby.create({
    data: {
      code: "PUBG01",
      title: "Squad Up - Erangel",
      game: "PUBG_MOBILE",
      visibility: "PUBLIC",
      maxPlayers: 4,
      rankFilter: "GOLD",
    },
  });

  const marvelLobby = await prisma.lobby.create({
    data: {
      code: "MRVL01",
      title: "Marvel Ranked Grind",
      game: "MARVEL_RIVALS",
      visibility: "PUBLIC",
      maxPlayers: 6,
      rankFilter: null,
    },
  });

  const privateLobby = await prisma.lobby.create({
    data: {
      code: "PRIV01",
      title: "Friends Only",
      game: "PUBG_MOBILE",
      visibility: "PRIVATE",
      maxPlayers: 4,
    },
  });

  console.log("  Created 3 lobbies");

  await prisma.lobbyMember.createMany({
    data: [
      { userId: yojjal.id, lobbyId: pubgLobby.id, role: "HOST", rank: "ACE" },
      {
        userId: gamer42.id,
        lobbyId: pubgLobby.id,
        role: "MEMBER",
        rank: "DIAMOND",
      },
      {
        userId: proPlayer.id,
        lobbyId: marvelLobby.id,
        role: "HOST",
        rank: "DIAMOND_I",
      },
      {
        userId: nightOwl.id,
        lobbyId: privateLobby.id,
        role: "HOST",
        rank: "CROWN",
      },
    ],
  });

  console.log("  Added lobby members");

  await prisma.message.createMany({
    data: [
      {
        content: "Welcome! Looking for 2 more for Erangel.",
        userId: yojjal.id,
        lobbyId: pubgLobby.id,
      },
      {
        content: "I'm in! Ready to drop hot.",
        userId: gamer42.id,
        lobbyId: pubgLobby.id,
      },
      {
        content: "LFG Marvel Rivals ranked! Any role welcome.",
        userId: proPlayer.id,
        lobbyId: marvelLobby.id,
      },
    ],
  });

  console.log("  Added chat messages");
  console.log("\nSeed complete!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error("Seed failed:", error);
    await prisma.$disconnect();
    process.exit(1);
  });
