import { pgTable, varchar, text, boolean, integer, timestamp, uuid, jsonb, uniqueIndex, index } from 'drizzle-orm/pg-core';
import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';

// ============================================================================
// USERS TABLE - Core user data with LeetCode and GFG stats consolidated
// ============================================================================
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),

  // Platform usernames
  leetcodeUsername: varchar('leetcode_username', { length: 255 }).notNull().unique(),
  gfgUsername: varchar('gfg_username', { length: 255 }),

  // Social links
  github: varchar('github', { length: 255 }).notNull(),
  linkedin: varchar('linkedin', { length: 255 }),
  phoneNumber: varchar('phone_number', { length: 32 }),

  // App metadata
  role: varchar('role', { length: 16 }).notNull().default('user'),
  onboardingCompleted: boolean('onboarding_completed').default(false),

  // LeetCode Stats (updated by sync job)
  easySolved: integer('easy_solved').default(0),
  mediumSolved: integer('medium_solved').default(0),
  hardSolved: integer('hard_solved').default(0),
  totalSolved: integer('total_solved').default(0),
  ranking: integer('ranking').default(0),
  avatar: varchar('avatar', { length: 512 }),
  country: varchar('country', { length: 64 }),
  streak: integer('streak').default(0),
  lastSubmission: varchar('last_submission', { length: 64 }),
  recentProblems: jsonb('recent_problems').default([]),

  // GFG Stats (optional)
  gfgSolved: integer('gfg_solved').default(0),
  gfgScore: integer('gfg_score').default(0),

  // Points calculation data - reset daily by cron
  todayPoints: integer('today_points').default(0),
  lastStatUpdate: timestamp('last_stat_update', { withTimezone: true }),
  roastIntensity: varchar('roast_intensity', { length: 16 }).default('medium'),
  dailyGrindTime: varchar('daily_grind_time', { length: 5 }), // HH:MM format like "09:30"

  // Baselines for daily growth calculation (reset by cron job at midnight)
  lastResetEasy: integer('last_reset_easy').default(0),
  lastResetMedium: integer('last_reset_medium').default(0),
  lastResetHard: integer('last_reset_hard').default(0),
  lastResetDate: varchar('last_reset_date', { length: 10 }), // YYYY-MM-DD format

  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  // Indexes for frequently queried columns
  index('users_role_idx').on(table.role),
  index('users_today_points_idx').on(table.todayPoints),
  index('users_gfg_username_idx').on(table.gfgUsername),
]);

// ============================================================================
// SETTINGS TABLE - Global application settings and automation state
// ============================================================================
export const settings = pgTable('settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  automationEnabled: boolean('automation_enabled').default(true),
  emailAutomationEnabled: boolean('email_automation_enabled').default(true),
  whatsappAutomationEnabled: boolean('whatsapp_automation_enabled').default(true),
  emailSchedule: jsonb('email_schedule').default(['09:00']),
  whatsappSchedule: jsonb('whatsapp_schedule').default(['09:30']),
  timezone: varchar('timezone', { length: 64 }).default('Asia/Kolkata'),
  maxDailyEmails: integer('max_daily_emails').default(100),
  maxDailyWhatsapp: integer('max_daily_whatsapp').default(100),
  emailsSentToday: integer('emails_sent_today').default(0),
  whatsappSentToday: integer('whatsapp_sent_today').default(0),
  lastEmailSent: timestamp('last_email_sent', { withTimezone: true }),
  lastWhatsappSent: timestamp('last_whatsapp_sent', { withTimezone: true }),
  lastResetDate: timestamp('last_reset_date', { withTimezone: true }).defaultNow(),
  skipWeekends: boolean('skip_weekends').default(false),
  skipHolidays: boolean('skip_holidays').default(false),
  customSkipDates: jsonb('custom_skip_dates').default([]),
  aiRoast: jsonb('ai_roast'), // Stores { mild: {message, subject}, medium: {...}, savage: {...}, date }
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// ============================================================================
// MESSAGE_TEMPLATES TABLE - Customizable message content for automation
// ============================================================================
export const messageTemplates = pgTable('message_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  type: varchar('type', { length: 32 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  subject: varchar('subject', { length: 255 }),
  content: text('content').notNull(),
  variables: jsonb('variables').default([]),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  uniqueIndex('type_name_idx').on(table.type, table.name),
]);

// ============================================================================
// DAILY_STATS TABLE - Historical snapshots of user platform statistics
// ============================================================================
export const dailyStats = pgTable('daily_stats', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  date: varchar('date', { length: 16 }).notNull(),
  platform: varchar('platform', { length: 16 }).notNull().default('leetcode'), // 'leetcode' or 'gfg'
  easy: integer('easy').default(0),
  medium: integer('medium').default(0),
  hard: integer('hard').default(0),
  total: integer('total').default(0),
  ranking: integer('ranking').default(0),
  avatar: varchar('avatar', { length: 512 }).default(''),
  country: varchar('country', { length: 64 }).default(''),
  streak: integer('streak').default(0),
  lastSubmission: varchar('last_submission', { length: 64 }),
  recentProblems: jsonb('recent_problems').default([]),
  previousTotal: integer('previous_total').default(0),
  todayPoints: integer('today_points').default(0),
}, (table) => [
  uniqueIndex('user_date_platform_idx').on(table.userId, table.date, table.platform),
  index('date_idx').on(table.date),
  index('user_id_idx').on(table.userId),
]);

// ============================================================================
// GROUPS TABLE - Competition groups with alphanumeric codes
// ============================================================================
export const groups = pgTable('groups', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: varchar('code', { length: 32 }).notNull().unique(), // Alphanumeric join code
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  ownerId: uuid('owner_id').notNull().references(() => users.id), // FK to users
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  index('groups_code_idx').on(table.code),
  index('groups_owner_idx').on(table.ownerId),
]);

// ============================================================================
// GROUP_MEMBERS TABLE - Many-to-many join table for multi-group membership
// ============================================================================
export const groupMembers = pgTable('group_members', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }), // FK with cascade
  groupId: uuid('group_id').notNull().references(() => groups.id, { onDelete: 'cascade' }), // FK with cascade
  joinedAt: timestamp('joined_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  // Composite unique index to prevent duplicate memberships
  uniqueIndex('group_members_user_group_idx').on(table.userId, table.groupId),
]);

// ============================================================================
// TYPE EXPORTS - For TypeScript inference
// ============================================================================
export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;
export type Group = InferSelectModel<typeof groups>;
export type NewGroup = InferInsertModel<typeof groups>;
export type GroupMember = InferSelectModel<typeof groupMembers>;
export type NewGroupMember = InferInsertModel<typeof groupMembers>;
export type Setting = InferSelectModel<typeof settings>;
export type NewSetting = InferInsertModel<typeof settings>;
export type DailyStat = InferSelectModel<typeof dailyStats>;
export type NewDailyStat = InferInsertModel<typeof dailyStats>;
export type MessageTemplate = InferSelectModel<typeof messageTemplates>;
export type NewMessageTemplate = InferInsertModel<typeof messageTemplates>;
