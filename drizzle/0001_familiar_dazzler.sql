ALTER TABLE "message_templates" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "message_templates" CASCADE;--> statement-breakpoint
ALTER TABLE "daily_stats" DROP CONSTRAINT "daily_stats_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "group_members" DROP CONSTRAINT "group_members_group_id_groups_id_fk";
--> statement-breakpoint
ALTER TABLE "group_members" DROP CONSTRAINT "group_members_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "groups" DROP CONSTRAINT "groups_owner_users_id_fk";
--> statement-breakpoint
DROP INDEX "user_date_idx";--> statement-breakpoint
ALTER TABLE "daily_stats" ADD COLUMN "platform" varchar(32) DEFAULT 'leetcode' NOT NULL;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "ai_roast" jsonb;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "gfg_username" varchar(255);--> statement-breakpoint
ALTER TABLE "daily_stats" ADD CONSTRAINT "daily_stats_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "groups" ADD CONSTRAINT "groups_owner_users_id_fk" FOREIGN KEY ("owner") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "user_platform_date_idx" ON "daily_stats" USING btree ("user_id","platform","date");--> statement-breakpoint
CREATE INDEX "date_idx" ON "daily_stats" USING btree ("date");--> statement-breakpoint
CREATE INDEX "user_id_idx" ON "daily_stats" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "platform_idx" ON "daily_stats" USING btree ("platform");--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "password";