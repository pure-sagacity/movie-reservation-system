CREATE TABLE "reservation" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"screening_id" text NOT NULL,
	"seats" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"total_price" numeric(10, 2) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "reservation" ADD CONSTRAINT "reservation_screening_id_screening_id_fk" FOREIGN KEY ("screening_id") REFERENCES "public"."screening"("id") ON DELETE cascade ON UPDATE no action;