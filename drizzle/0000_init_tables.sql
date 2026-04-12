CREATE SCHEMA "characters";
--> statement-breakpoint
CREATE SCHEMA "chats";
--> statement-breakpoint
CREATE SCHEMA "junctions";
--> statement-breakpoint
CREATE SCHEMA "projects";
--> statement-breakpoint
CREATE SCHEMA "users";
--> statement-breakpoint
CREATE TABLE "characters"."characters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"owner_auth0_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "junctions"."character_to_member" (
	"character_id" uuid,
	"member_id" uuid,
	CONSTRAINT "character_to_member_pkey" PRIMARY KEY("character_id","member_id")
);
--> statement-breakpoint
CREATE TABLE "chats"."chat_rooms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"expires_at" timestamp,
	"active" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "projects"."documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"period_start" text,
	"period_end" text,
	"file_path" text,
	"before_doc_id" uuid,
	"after_doc_id" uuid
);
--> statement-breakpoint
CREATE TABLE "projects"."drafts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users"."members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" text NOT NULL,
	"auth0_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chats"."messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sender_name" text,
	"content" text NOT NULL,
	"roomId" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "projects"."projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"draft_id" uuid
);
--> statement-breakpoint
CREATE TABLE "junctions"."project_to_character" (
	"project_id" uuid,
	"character_id" uuid,
	CONSTRAINT "project_to_character_pkey" PRIMARY KEY("project_id","character_id")
);
--> statement-breakpoint
CREATE TABLE "junctions"."project_to_documents" (
	"project_id" uuid,
	"document_id" uuid,
	CONSTRAINT "project_to_document_pkey" PRIMARY KEY("project_id","document_id")
);
--> statement-breakpoint
CREATE TABLE "junctions"."project_to_member" (
	"project_id" uuid,
	"member_id" uuid,
	CONSTRAINT "project_to_member_pkey" PRIMARY KEY("project_id","member_id")
);
--> statement-breakpoint
ALTER TABLE "junctions"."character_to_member" ADD CONSTRAINT "character_to_member_character_id_characters_id_fk" FOREIGN KEY ("character_id") REFERENCES "characters"."characters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "junctions"."character_to_member" ADD CONSTRAINT "character_to_member_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "users"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chats"."messages" ADD CONSTRAINT "messages_roomId_chat_rooms_id_fk" FOREIGN KEY ("roomId") REFERENCES "chats"."chat_rooms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects"."projects" ADD CONSTRAINT "projects_draft_id_drafts_id_fk" FOREIGN KEY ("draft_id") REFERENCES "projects"."drafts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "junctions"."project_to_character" ADD CONSTRAINT "project_to_character_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "projects"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "junctions"."project_to_character" ADD CONSTRAINT "project_to_character_character_id_characters_id_fk" FOREIGN KEY ("character_id") REFERENCES "characters"."characters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "junctions"."project_to_documents" ADD CONSTRAINT "project_to_documents_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "projects"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "junctions"."project_to_documents" ADD CONSTRAINT "project_to_documents_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "projects"."documents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "junctions"."project_to_member" ADD CONSTRAINT "project_to_member_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "projects"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "junctions"."project_to_member" ADD CONSTRAINT "project_to_member_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "users"."members"("id") ON DELETE no action ON UPDATE no action;