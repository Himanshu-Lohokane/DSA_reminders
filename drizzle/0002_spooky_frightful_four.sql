ALTER TABLE "users" ADD COLUMN "onboarding_completed" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "roast_intensity" varchar(16) DEFAULT 'medium';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "daily_grind_time" varchar(5);