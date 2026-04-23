import { prisma } from './db';
import { Role } from '@prisma/client';

export async function createNotification(userId: string, message: string, link?: string | null) {
  await prisma.notification.create({ data: { userId, message, link: link ?? null } });
}

export async function notifyRole(role: Role, message: string, link?: string | null) {
  const users = await prisma.user.findMany({
    where: { roles: { has: role } },
    select: { id: true },
  });
  if (users.length === 0) return;
  await prisma.notification.createMany({
    data: users.map(u => ({ userId: u.id, message, link: link ?? null })),
  });
}

export async function notifyUsers(userIds: string[], message: string, link?: string | null) {
  if (userIds.length === 0) return;
  await prisma.notification.createMany({
    data: userIds.map(userId => ({ userId, message, link: link ?? null })),
  });
}
