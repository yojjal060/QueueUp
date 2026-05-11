import { prisma } from '../libs/prisma'

export async function createGuestUser() {
  const guestName = `Guest${Math.floor(Math.random() * 10000)}`
  return prisma.user.create({
    data: { guestName }
  })
}