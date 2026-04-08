-- Migration: Convert role column to roles array for all existing users
-- This runs the actual PostgreSQL migration to update data

-- First, the schema change was already done by prisma db push
-- Now we need to ensure existing users have their string role migrated.
-- Prisma with PostgreSQL uses an array type for Role[]

-- Update users where roles is empty (migration gap) by setting all current single-role data
-- Since the column was renamed, run a seed check via Prisma Studio or direct query:
UPDATE "User" SET "roles" = ARRAY['MASTER'::"Role"] WHERE "roles" = '{}' AND username = 'master';
UPDATE "User" SET "roles" = ARRAY['ADMIN'::"Role"] WHERE "roles" = '{}' AND username = 'admin';
UPDATE "User" SET "roles" = ARRAY['KAPRODI'::"Role"] WHERE "roles" = '{}' AND username = 'kaprodi';
UPDATE "User" SET "roles" = ARRAY['KOORDINATOR'::"Role"] WHERE "roles" = '{}' AND username = 'koordinator';
-- Set any remaining empty role users as DOSEN
UPDATE "User" SET "roles" = ARRAY['DOSEN'::"Role"] WHERE "roles" = '{}';
