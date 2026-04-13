CREATE TYPE "junctions"."project_role" AS ENUM('OWNER', 'MODERATOR', 'WRITER');--> statement-breakpoint
ALTER TABLE "junctions"."project_to_member" ADD COLUMN "role" "junctions"."project_role";