import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1713100000000 implements MigrationInterface {
  name = 'InitialSchema1713100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enums
    await queryRunner.query(`
      CREATE TYPE "role_enum" AS ENUM (
        'SUPER_ADMIN', 'MUNICIPAL_ADMIN', 'DEPARTMENT_MANAGER', 'DEPARTMENT_STAFF', 'CITIZEN'
      )
    `);
    await queryRunner.query(`
      CREATE TYPE "department_type_enum" AS ENUM (
        'INFRASTRUCTURE', 'UTILITIES', 'ENVIRONMENTAL', 'ADMINISTRATIVE'
      )
    `);
    await queryRunner.query(`
      CREATE TYPE "complaint_status_enum" AS ENUM (
        'SUBMITTED', 'AI_ANALYZED', 'ROUTED', 'UNDER_REVIEW', 'ASSIGNED',
        'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REJECTED', 'DUPLICATE'
      )
    `);
    await queryRunner.query(`
      CREATE TYPE "complaint_category_enum" AS ENUM (
        'ELECTRICITY', 'WATER', 'SEWAGE', 'ROADS', 'SANITATION',
        'ENVIRONMENT', 'PUBLIC_CLEANLINESS', 'OTHER'
      )
    `);
    await queryRunner.query(`
      CREATE TYPE "priority_enum" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')
    `);
    await queryRunner.query(`
      CREATE TYPE "complaint_source_enum" AS ENUM (
        'MOBILE_APP', 'WEB_PORTAL', 'PHONE_CALL', 'WALK_IN', 'EMAIL'
      )
    `);
    await queryRunner.query(`
      CREATE TYPE "assignment_status_enum" AS ENUM (
        'PENDING', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'REASSIGNED', 'CANCELLED'
      )
    `);
    await queryRunner.query(`
      CREATE TYPE "assignment_source_enum" AS ENUM (
        'AI_ROUTING', 'MANUAL', 'SYSTEM_RULE'
      )
    `);
    await queryRunner.query(`
      CREATE TYPE "ai_analysis_status_enum" AS ENUM (
        'PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'
      )
    `);
    await queryRunner.query(`
      CREATE TYPE "notification_type_enum" AS ENUM (
        'COMPLAINT_SUBMITTED', 'COMPLAINT_STATUS_CHANGED', 'COMPLAINT_ASSIGNED',
        'COMPLAINT_RESOLVED', 'COMPLAINT_CLOSED', 'COMPLAINT_COMMENT', 'SYSTEM_ALERT'
      )
    `);

    // ── users ──
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid DEFAULT gen_random_uuid() NOT NULL,
        "full_name" varchar(255) NOT NULL,
        "email" varchar(255) NOT NULL,
        "phone_number" varchar(20),
        "password_hash" varchar(255) NOT NULL,
        "role" "role_enum" NOT NULL DEFAULT 'CITIZEN',
        "is_active" boolean NOT NULL DEFAULT true,
        "last_login_at" timestamptz,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_users" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_users_email" UNIQUE ("email")
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_users_email" ON "users" ("email")`);
    await queryRunner.query(`CREATE INDEX "IDX_users_phone" ON "users" ("phone_number")`);
    await queryRunner.query(`CREATE INDEX "IDX_users_role" ON "users" ("role")`);

    // ── departments ──
    await queryRunner.query(`
      CREATE TABLE "departments" (
        "id" uuid DEFAULT gen_random_uuid() NOT NULL,
        "name" varchar(255) NOT NULL,
        "code" varchar(50) NOT NULL,
        "type" "department_type_enum" NOT NULL,
        "description" text,
        "is_active" boolean NOT NULL DEFAULT true,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_departments" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_departments_code" UNIQUE ("code")
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_departments_code" ON "departments" ("code")`);
    await queryRunner.query(`CREATE INDEX "IDX_departments_active" ON "departments" ("is_active")`);

    // ── user_departments ──
    await queryRunner.query(`
      CREATE TABLE "user_departments" (
        "id" uuid DEFAULT gen_random_uuid() NOT NULL,
        "user_id" uuid NOT NULL,
        "department_id" uuid NOT NULL,
        "title" varchar(255),
        "is_primary" boolean NOT NULL DEFAULT false,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_user_departments" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_user_dept" UNIQUE ("user_id", "department_id"),
        CONSTRAINT "FK_user_departments_user" FOREIGN KEY ("user_id")
          REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_user_departments_dept" FOREIGN KEY ("department_id")
          REFERENCES "departments"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_user_dept_user" ON "user_departments" ("user_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_user_dept_dept" ON "user_departments" ("department_id")`);

    // ── complaints ──
    await queryRunner.query(`
      CREATE TABLE "complaints" (
        "id" uuid DEFAULT gen_random_uuid() NOT NULL,
        "reference_number" varchar(30) NOT NULL,
        "citizen_id" uuid NOT NULL,
        "title" varchar(500),
        "description" text,
        "category" "complaint_category_enum" NOT NULL DEFAULT 'OTHER',
        "subcategory" varchar(100),
        "status" "complaint_status_enum" NOT NULL DEFAULT 'SUBMITTED',
        "priority" "priority_enum" NOT NULL DEFAULT 'MEDIUM',
        "source" "complaint_source_enum" NOT NULL DEFAULT 'MOBILE_APP',
        "manually_entered_address" text,
        "detected_address" text,
        "department_id" uuid,
        "ai_suggested_department_id" uuid,
        "assigned_by_system" boolean NOT NULL DEFAULT false,
        "is_duplicate" boolean NOT NULL DEFAULT false,
        "duplicate_of_complaint_id" uuid,
        "submitted_at" timestamptz,
        "resolved_at" timestamptz,
        "closed_at" timestamptz,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_complaints" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_complaints_ref" UNIQUE ("reference_number"),
        CONSTRAINT "FK_complaints_citizen" FOREIGN KEY ("citizen_id")
          REFERENCES "users"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_complaints_dept" FOREIGN KEY ("department_id")
          REFERENCES "departments"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_complaints_ai_dept" FOREIGN KEY ("ai_suggested_department_id")
          REFERENCES "departments"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_complaints_dup" FOREIGN KEY ("duplicate_of_complaint_id")
          REFERENCES "complaints"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_complaints_ref" ON "complaints" ("reference_number")`);
    await queryRunner.query(`CREATE INDEX "IDX_complaints_status" ON "complaints" ("status")`);
    await queryRunner.query(`CREATE INDEX "IDX_complaints_category" ON "complaints" ("category")`);
    await queryRunner.query(`CREATE INDEX "IDX_complaints_priority" ON "complaints" ("priority")`);
    await queryRunner.query(`CREATE INDEX "IDX_complaints_dept" ON "complaints" ("department_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_complaints_citizen" ON "complaints" ("citizen_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_complaints_submitted" ON "complaints" ("submitted_at")`);
    await queryRunner.query(`CREATE INDEX "IDX_complaints_status_priority" ON "complaints" ("status", "priority")`);
    await queryRunner.query(`CREATE INDEX "IDX_complaints_cat_status" ON "complaints" ("category", "status")`);
    await queryRunner.query(`CREATE INDEX "IDX_complaints_dept_status" ON "complaints" ("department_id", "status")`);

    // ── complaint_images ──
    await queryRunner.query(`
      CREATE TABLE "complaint_images" (
        "id" uuid DEFAULT gen_random_uuid() NOT NULL,
        "complaint_id" uuid NOT NULL,
        "image_url" varchar(1024) NOT NULL,
        "image_mime_type" varchar(50),
        "image_size" integer,
        "sort_order" smallint NOT NULL DEFAULT 0,
        "uploaded_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_complaint_images" PRIMARY KEY ("id"),
        CONSTRAINT "FK_complaint_images_complaint" FOREIGN KEY ("complaint_id")
          REFERENCES "complaints"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_complaint_images_complaint" ON "complaint_images" ("complaint_id")`);

    // ── complaint_locations ──
    await queryRunner.query(`
      CREATE TABLE "complaint_locations" (
        "id" uuid DEFAULT gen_random_uuid() NOT NULL,
        "complaint_id" uuid NOT NULL,
        "latitude" decimal(10,7) NOT NULL,
        "longitude" decimal(10,7) NOT NULL,
        "accuracy_meters" real,
        "neighborhood" varchar(255),
        "area_name" varchar(255),
        "street_name" varchar(255),
        "city" varchar(100) NOT NULL DEFAULT 'Hebron',
        "governorate" varchar(100) NOT NULL DEFAULT 'Hebron',
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_complaint_locations" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_complaint_locations_complaint" UNIQUE ("complaint_id"),
        CONSTRAINT "FK_complaint_locations_complaint" FOREIGN KEY ("complaint_id")
          REFERENCES "complaints"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_complaint_loc_complaint" ON "complaint_locations" ("complaint_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_complaint_loc_coords" ON "complaint_locations" ("latitude", "longitude")`);
    await queryRunner.query(`CREATE INDEX "IDX_complaint_loc_neighborhood" ON "complaint_locations" ("neighborhood")`);
    await queryRunner.query(`CREATE INDEX "IDX_complaint_loc_area" ON "complaint_locations" ("area_name")`);
    await queryRunner.query(`CREATE INDEX "IDX_complaint_loc_city" ON "complaint_locations" ("city")`);

    // ── complaint_comments ──
    await queryRunner.query(`
      CREATE TABLE "complaint_comments" (
        "id" uuid DEFAULT gen_random_uuid() NOT NULL,
        "complaint_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "body" text NOT NULL,
        "is_internal" boolean NOT NULL DEFAULT false,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_complaint_comments" PRIMARY KEY ("id"),
        CONSTRAINT "FK_complaint_comments_complaint" FOREIGN KEY ("complaint_id")
          REFERENCES "complaints"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_complaint_comments_user" FOREIGN KEY ("user_id")
          REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_complaint_comments_complaint" ON "complaint_comments" ("complaint_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_complaint_comments_user" ON "complaint_comments" ("user_id")`);

    // ── complaint_status_history ──
    await queryRunner.query(`
      CREATE TABLE "complaint_status_history" (
        "id" uuid DEFAULT gen_random_uuid() NOT NULL,
        "complaint_id" uuid NOT NULL,
        "old_status" "complaint_status_enum",
        "new_status" "complaint_status_enum" NOT NULL,
        "changed_by_user_id" uuid,
        "reason" varchar(500),
        "notes" text,
        "changed_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_complaint_status_history" PRIMARY KEY ("id"),
        CONSTRAINT "FK_status_history_complaint" FOREIGN KEY ("complaint_id")
          REFERENCES "complaints"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_status_history_user" FOREIGN KEY ("changed_by_user_id")
          REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_status_history_complaint" ON "complaint_status_history" ("complaint_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_status_history_changed_at" ON "complaint_status_history" ("changed_at")`);

    // ── complaint_assignments ──
    await queryRunner.query(`
      CREATE TABLE "complaint_assignments" (
        "id" uuid DEFAULT gen_random_uuid() NOT NULL,
        "complaint_id" uuid NOT NULL,
        "department_id" uuid NOT NULL,
        "assigned_to_user_id" uuid,
        "assigned_by_user_id" uuid,
        "assignment_source" "assignment_source_enum" NOT NULL,
        "notes" text,
        "assigned_at" timestamptz NOT NULL DEFAULT now(),
        "accepted_at" timestamptz,
        "completed_at" timestamptz,
        "status" "assignment_status_enum" NOT NULL DEFAULT 'PENDING',
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_complaint_assignments" PRIMARY KEY ("id"),
        CONSTRAINT "FK_assignments_complaint" FOREIGN KEY ("complaint_id")
          REFERENCES "complaints"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_assignments_dept" FOREIGN KEY ("department_id")
          REFERENCES "departments"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_assignments_to_user" FOREIGN KEY ("assigned_to_user_id")
          REFERENCES "users"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_assignments_by_user" FOREIGN KEY ("assigned_by_user_id")
          REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_assignments_complaint" ON "complaint_assignments" ("complaint_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_assignments_dept" ON "complaint_assignments" ("department_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_assignments_to_user" ON "complaint_assignments" ("assigned_to_user_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_assignments_status" ON "complaint_assignments" ("status")`);

    // ── ai_analyses ──
    await queryRunner.query(`
      CREATE TABLE "ai_analyses" (
        "id" uuid DEFAULT gen_random_uuid() NOT NULL,
        "complaint_id" uuid NOT NULL,
        "model_name" varchar(100) NOT NULL,
        "raw_label" varchar(255),
        "predicted_category" "complaint_category_enum",
        "generated_description" text,
        "suggested_department_id" uuid,
        "confidence_score" decimal(5,4),
        "severity_score" decimal(5,4),
        "repeat_likelihood_score" decimal(5,4),
        "analysis_status" "ai_analysis_status_enum" NOT NULL DEFAULT 'PENDING',
        "analyzed_at" timestamptz,
        "raw_payload_json" jsonb,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_ai_analyses" PRIMARY KEY ("id"),
        CONSTRAINT "FK_ai_analyses_complaint" FOREIGN KEY ("complaint_id")
          REFERENCES "complaints"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_ai_analyses_dept" FOREIGN KEY ("suggested_department_id")
          REFERENCES "departments"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_ai_analyses_complaint" ON "ai_analyses" ("complaint_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_ai_analyses_status" ON "ai_analyses" ("analysis_status")`);
    await queryRunner.query(`CREATE INDEX "IDX_ai_analyses_category" ON "ai_analyses" ("predicted_category")`);

    // ── notifications ──
    await queryRunner.query(`
      CREATE TABLE "notifications" (
        "id" uuid DEFAULT gen_random_uuid() NOT NULL,
        "user_id" uuid NOT NULL,
        "type" "notification_type_enum" NOT NULL,
        "title" varchar(255) NOT NULL,
        "body" text NOT NULL,
        "related_complaint_id" uuid,
        "is_read" boolean NOT NULL DEFAULT false,
        "read_at" timestamptz,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_notifications" PRIMARY KEY ("id"),
        CONSTRAINT "FK_notifications_user" FOREIGN KEY ("user_id")
          REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_notifications_complaint" FOREIGN KEY ("related_complaint_id")
          REFERENCES "complaints"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_notifications_user" ON "notifications" ("user_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_notifications_read" ON "notifications" ("is_read")`);
    await queryRunner.query(`CREATE INDEX "IDX_notifications_user_read" ON "notifications" ("user_id", "is_read")`);
    await queryRunner.query(`CREATE INDEX "IDX_notifications_created" ON "notifications" ("created_at")`);

    // ── complaint_voice_notes ──
    await queryRunner.query(`
      CREATE TABLE "complaint_voice_notes" (
        "id" uuid DEFAULT gen_random_uuid() NOT NULL,
        "complaint_id" uuid NOT NULL,
        "voice_url" varchar(1024) NOT NULL,
        "voice_mime_type" varchar(50),
        "file_size" integer,
        "duration_seconds" real,
        "transcription" text,
        "transcription_language" varchar(10),
        "is_transcribed" boolean NOT NULL DEFAULT false,
        "sort_order" smallint NOT NULL DEFAULT 0,
        "uploaded_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_complaint_voice_notes" PRIMARY KEY ("id"),
        CONSTRAINT "FK_voice_notes_complaint" FOREIGN KEY ("complaint_id")
          REFERENCES "complaints"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_voice_notes_complaint" ON "complaint_voice_notes" ("complaint_id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "notifications" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "ai_analyses" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "complaint_assignments" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "complaint_status_history" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "complaint_comments" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "complaint_voice_notes" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "complaint_locations" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "complaint_images" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "complaints" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "user_departments" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "departments" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users" CASCADE`);
    await queryRunner.query(`DROP TYPE IF EXISTS "notification_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "ai_analysis_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "assignment_source_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "assignment_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "complaint_source_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "priority_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "complaint_category_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "complaint_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "department_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "role_enum"`);
  }
}
