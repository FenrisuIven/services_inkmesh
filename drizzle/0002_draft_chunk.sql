CREATE TABLE "projects"."draft_chunks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"content" text,
	"draft_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "projects"."draft_chunks" ADD CONSTRAINT "draft_chunks_draft_id_drafts_id_fk" FOREIGN KEY ("draft_id") REFERENCES "projects"."drafts"("id") ON DELETE no action ON UPDATE no action;