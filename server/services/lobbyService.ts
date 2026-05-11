import { prisma } from '../libs/prisma'
import { generateLobbyCode } from '../utils/generateCode'

export async function createLobby(userId: string, name: string) {
  const code = generateLobbyCode()
  
  return prisma.$transaction(async (tx) => {
    const lobby = await tx.lobby.create({
      data: { code, name }
    })
    
    await tx.lobbyMember.create({
      data: {
        userId,
        lobbyId: lobby.id,
        role: 'HOST'
      }
    })
    
    return lobby
  })
}

export async function joinLobby(userId: string, code: string) {
  const lobby = await prisma.lobby.findUnique({
    where: { code, isActive: true }
  })
  
  if (!lobby) throw new Error('Lobby not found')
  
  const existing = await prisma.lobbyMember.findUnique({
    where: {
      userId_lobbyId: { userId, lobbyId: lobby.id }
    }
  })
  
  if (existing) throw new Error('Already in lobby')
  
  await prisma.lobbyMember.create({
    data: { userId, lobbyId: lobby.id, role: 'MEMBER' }
  })
  
  return lobby
}

export async function getLobbyDetails(code: string) {
  const lobby = await prisma.lobby.findUnique({
    where: { code, isActive: true },
    include: {
      members: {
        include: { user: true },
        orderBy: { joinedAt: 'asc' }
      }
    }
  })
  
  if (!lobby) throw new Error('Lobby not found')
  return lobby
}