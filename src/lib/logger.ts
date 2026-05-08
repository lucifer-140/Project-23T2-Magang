import { prisma } from '@/lib/db';

function log(level: 'INFO' | 'WARN' | 'DEBUG' | 'ERROR', route: string, message: string, stack?: string, userId?: string) {
  prisma.systemLog.create({ data: { level, route, message, stack, userId } }).catch(() => {});
}

export function logInfo(route: string, message: string, userId?: string) {
  log('INFO', route, message, undefined, userId);
}

export function logWarn(route: string, message: string, userId?: string) {
  log('WARN', route, message, undefined, userId);
}

export function logDebug(route: string, message: string, userId?: string) {
  log('DEBUG', route, message, undefined, userId);
}

export function logError(route: string, message: string, stack?: string, userId?: string) {
  log('ERROR', route, message, stack, userId);
}
