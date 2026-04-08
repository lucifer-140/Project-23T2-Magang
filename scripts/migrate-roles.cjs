const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  // Check current state
  const users = await p.user.findMany({ select: { id: true, username: true, roles: true } });
  console.log('Current users:');
  for (const u of users) {
    console.log(`  ${u.username}: roles=${JSON.stringify(u.roles)}`);
  }

  // Fix any users with empty roles by assigning DOSEN as default
  const emptyRoleUsers = users.filter(u => !u.roles || u.roles.length === 0);
  console.log(`\nUsers with empty roles: ${emptyRoleUsers.length}`);
  
  for (const u of emptyRoleUsers) {
    let rolesToAssign = ['DOSEN'];
    // Try to assign based on username hints
    if (u.username === 'master') rolesToAssign = ['MASTER'];
    else if (u.username === 'admin') rolesToAssign = ['ADMIN'];
    else if (u.username === 'kaprodi') rolesToAssign = ['KAPRODI', 'DOSEN'];
    else if (u.username === 'koordinator') rolesToAssign = ['KOORDINATOR', 'DOSEN'];
    
    await p.user.update({ where: { id: u.id }, data: { roles: { set: rolesToAssign } } });
    console.log(`  Fixed ${u.username}: set roles to ${JSON.stringify(rolesToAssign)}`);
  }
  console.log('Done!');
}

main().catch(console.error).finally(() => p.$disconnect());
