CREATE TABLE "chats"."voice_chat" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "chats"."chat_rooms" ADD COLUMN "project_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "chats"."messages" ADD COLUMN "sent_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "chats"."messages" ADD COLUMN "sender_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "chats"."voice_chat" ADD CONSTRAINT "voice_chat_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "projects"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chats"."chat_rooms" ADD CONSTRAINT "chat_rooms_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "projects"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chats"."messages" ADD CONSTRAINT "messages_sender_id_members_id_fk" FOREIGN KEY ("sender_id") REFERENCES "users"."members"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
