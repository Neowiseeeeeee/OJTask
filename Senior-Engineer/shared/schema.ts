import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull(), // 'student', 'supervisor', 'school', 'admin'
  name: text("name").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  email: text("email"),
  organization: text("organization"),
  profilePicture: text("profile_picture"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  emailVerified: boolean("email_verified").notNull().default(false),
});

export const spaces = pgTable("spaces", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'official', 'private'
  joinCode: text("join_code"),
  ownerId: integer("owner_id").notNull(),
  targetHours: integer("target_hours").notNull().default(486),
});

export const spaceMembers = pgTable("space_members", {
  id: serial("id").primaryKey(),
  spaceId: integer("space_id").notNull(),
  userId: integer("user_id").notNull(),
  role: text("role").notNull(),
});

export const groups = pgTable("groups", {
  id: serial("id").primaryKey(),
  spaceId: integer("space_id").notNull(),
  name: text("name").notNull(),
});

export const timeLogs = pgTable("time_logs", {
  id: serial("id").primaryKey(),
  spaceId: integer("space_id").notNull(),
  userId: integer("user_id").notNull(),
  date: text("date").notNull(),
  hours: integer("hours").notNull(),
  taskId: integer("task_id"),
  description: text("description"),
  status: text("status").notNull().default('pending'),
});

export const scrums = pgTable("scrums", {
  id: serial("id").primaryKey(),
  spaceId: integer("space_id").notNull(),
  userId: integer("user_id").notNull(),
  date: text("date").notNull(),
  taskYesterdayPlanned: text("task_yesterday_planned").notNull(),
  taskYesterdayCompleted: text("task_yesterday_completed").notNull(),
  taskTodayPlanned: text("task_today_planned").notNull(),
  taskTodayCompleted: text("task_today_completed").notNull(),
  whatNext: text("what_next").notNull(),
  timeSpent: integer("time_spent").notNull(),
  reflection: text("reflection").notNull(),
  completionPercentage: integer("completion_percentage").notNull().default(0),
  isApproved: boolean("is_approved").default(false),
});

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  spaceId: integer("space_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  type: text("type").notNull(), // 'personal', 'assigned'
  status: text("status").notNull(), // 'todo', 'doing', 'done'
  assignedToId: integer("assigned_to_id"), // kept for backward compatibility
  groupId: integer("group_id"),
  authorId: integer("author_id").notNull(),
  supervisorApproved: boolean("supervisor_approved").default(false),
});

export const taskAssignees = pgTable("task_assignees", {
  id: serial("id").primaryKey(),
  taskId: integer("task_id").notNull(),
  userId: integer("user_id").notNull(),
});

export const attendance = pgTable("attendance", {
  id: serial("id").primaryKey(),
  spaceId: integer("space_id").notNull(),
  userId: integer("user_id").notNull(),
  date: text("date").notNull(),
  status: text("status").notNull(), // 'present', 'absent', 'holiday', 'weekend', 'missing'
});

export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  spaceId: integer("space_id").notNull(),
  uploaderId: integer("uploader_id").notNull(),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'requirement', 'project', 'task', 'other'
  documentType: text("document_type").notNull(), // Specific type like 'MOA', 'Resume', 'Project Report'
  uploadDate: text("upload_date").notNull(),
  status: text("status").notNull(), // 'submitted', 'approved', 'rejected'
  filePath: text("file_path"), // Path to stored file
  fileSize: integer("file_size"), // File size in bytes
  mimeType: text("mime_type"), // MIME type of the file
  approvedBy: integer("approved_by"), // ID of supervisor who approved
  approvedDate: text("approved_date"), // Date when approved
  rejectionReason: text("rejection_reason"), // Reason for rejection
  isRequired: boolean("is_required").default(false), // Whether this is a required document
  deadline: text("deadline"), // Deadline for this document
});


export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  spaceId: integer("space_id").notNull(),
  senderId: integer("sender_id").notNull(),
  recipientId: integer("recipient_id").notNull(),
  channelId: text("channel_id").notNull(),
  content: text("content").notNull(),
  timestamp: text("timestamp").notNull(),
  isRead: boolean("is_read").default(false),
  status: text("status").notNull().default("sent"),
});

// ─── NEW TABLES ───────────────────────────────────────────────────────────────

export const evaluations = pgTable("evaluations", {
  id: serial("id").primaryKey(),
  spaceId: integer("space_id").notNull(),
  evaluatorId: integer("evaluator_id").notNull(),
  evaluateeId: integer("evaluatee_id").notNull(),
  type: text("type").notNull(), // 'midterm', 'final'
  punctuality: integer("punctuality").notNull(), // 1-5
  attitude: integer("attitude").notNull(),
  technical: integer("technical").notNull(),
  communication: integer("communication").notNull(),
  overall: integer("overall").notNull(),
  comments: text("comments").notNull().default(''),
  date: text("date").notNull(),
});

export const leaveRequests = pgTable("leave_requests", {
  id: serial("id").primaryKey(),
  spaceId: integer("space_id").notNull(),
  userId: integer("user_id").notNull(),
  date: text("date").notNull(),
  reason: text("reason").notNull(),
  status: text("status").notNull().default('pending'), // 'pending', 'approved', 'rejected'
});

export const announcements = pgTable("announcements", {
  id: serial("id").primaryKey(),
  spaceId: integer("space_id").notNull(),
  authorId: integer("author_id").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  date: text("date").notNull(),
});

export const spaceSettings = pgTable("space_settings", {
  id: serial("id").primaryKey(),
  spaceId: integer("space_id").notNull(),
  // OJT completion requirements
  totalRequiredHours: integer("total_required_hours").default(486), // Total hours required to complete OJT
  // Document requirements
  requiredDocuments: text("required_documents").array(), // Array of required document types
  documentDeadlines: text("document_deadlines").array(), // Array of deadline descriptions
  // Time requirements
  dailyHoursMin: integer("daily_hours_min").default(1), // Minimum daily hours
  dailyHoursMax: integer("daily_hours_max").default(8), // Maximum daily hours
  weeklyHoursMin: integer("weekly_hours_min").default(20), // Minimum weekly hours
  weeklyHoursMax: integer("weekly_hours_max").default(40), // Maximum weekly hours
  // Attendance requirements
  requiredAttendanceDays: integer("required_attendance_days").default(5), // Days per week
  allowedAbsences: integer("allowed_absences").default(2), // Maximum allowed absences per month
  // Scrum requirements
  scrumFrequency: text("scrum_frequency").default("daily"), // 'daily', 'weekly', 'bi-weekly'
  scrumTimeRequirement: text("scrum_time_requirement").default("end_of_day"), // 'morning', 'end_of_day', 'flexible'
  // Evaluation settings
  evaluationFrequency: text("evaluation_frequency").default("monthly"), // 'weekly', 'monthly', 'quarterly'
  evaluationCriteria: text("evaluation_criteria").array(), // Custom evaluation criteria
  // Company policies
  companyPolicies: text("company_policies"), // Company rules and regulations
  workingHours: text("working_hours").default("9:00 AM - 6:00 PM"), // Standard working hours
  breakDuration: integer("break_duration").default(60), // Break duration in minutes
  // Communication settings
  communicationChannels: text("communication_channels").array(), // Required communication methods
  reportingStructure: text("reporting_structure"), // Reporting hierarchy and process
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─── INSERT SCHEMAS ───────────────────────────────────────────────────────────

export const insertUserSchema = createInsertSchema(users)
  .omit({ id: true })
  .extend({
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    email: z.string().optional(),
    organization: z.string().optional(),
    profilePicture: z.string().optional(),
    createdAt: z.date().optional(),
    updatedAt: z.date().optional(),
    emailVerified: z.boolean().optional(),
  });
export const insertSpaceSchema = createInsertSchema(spaces).omit({ id: true });
export const insertSpaceMemberSchema = createInsertSchema(spaceMembers).omit({ id: true });
export const insertGroupSchema = createInsertSchema(groups).omit({ id: true });
export const insertTimeLogSchema = createInsertSchema(timeLogs).omit({ id: true, status: true });
export const insertScrumSchema = createInsertSchema(scrums).omit({ id: true, isApproved: true });
export const insertTaskSchema = createInsertSchema(tasks).omit({ id: true });
export const insertTaskAssigneeSchema = createInsertSchema(taskAssignees).omit({ id: true });
export const insertAttendanceSchema = createInsertSchema(attendance).omit({ id: true });
export const insertDocumentSchema = createInsertSchema(documents).omit({ id: true, status: true, uploadDate: true });
export const insertMessageSchema = createInsertSchema(messages).omit({ id: true, timestamp: true, isRead: true, status: true }).extend({
  recipientId: z.number(),
});
export const insertEvaluationSchema = createInsertSchema(evaluations).omit({ id: true });
export const insertLeaveRequestSchema = createInsertSchema(leaveRequests).omit({ id: true, status: true });
export const insertAnnouncementSchema = createInsertSchema(announcements).omit({ id: true });
export const insertSpaceSettingsSchema = createInsertSchema(spaceSettings).omit({ id: true, createdAt: true, updatedAt: true });

// ─── TYPES ────────────────────────────────────────────────────────────────────

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Space = typeof spaces.$inferSelect;
export type InsertSpace = z.infer<typeof insertSpaceSchema>;
export type SpaceMember = typeof spaceMembers.$inferSelect;
export type InsertSpaceMember = z.infer<typeof insertSpaceMemberSchema>;
export type Group = typeof groups.$inferSelect;
export type InsertGroup = z.infer<typeof insertGroupSchema>;
export type TimeLog = typeof timeLogs.$inferSelect;
export type InsertTimeLog = z.infer<typeof insertTimeLogSchema>;
export type Scrum = typeof scrums.$inferSelect;
export type InsertScrum = z.infer<typeof insertScrumSchema>;
export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type TaskAssignee = typeof taskAssignees.$inferSelect;
export type InsertTaskAssignee = z.infer<typeof insertTaskAssigneeSchema>;
export type Attendance = typeof attendance.$inferSelect;
export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;
export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Evaluation = typeof evaluations.$inferSelect;
export type InsertEvaluation = z.infer<typeof insertEvaluationSchema>;
export type LeaveRequest = typeof leaveRequests.$inferSelect;
export type InsertLeaveRequest = z.infer<typeof insertLeaveRequestSchema>;
export type Announcement = typeof announcements.$inferSelect;
export type InsertAnnouncement = z.infer<typeof insertAnnouncementSchema>;
export type SpaceSettings = typeof spaceSettings.$inferSelect;
export type InsertSpaceSettings = z.infer<typeof insertSpaceSettingsSchema>;

// ─── QUERY PARAMS ─────────────────────────────────────────────────────────────

export const pageQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sortBy: z.enum(['createdAt', 'updatedAt', 'id', 'title', 'status', 'name']).default('createdAt'),
  sortDir: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().optional(),
});

export type PageQuery = z.infer<typeof pageQuerySchema>;

export const taskQuerySchema = pageQuerySchema.extend({
  status: z.string().optional(),
  type: z.string().optional(),
  assignedToId: z.coerce.number().optional(),
  groupId: z.coerce.number().optional(),
  authorId: z.coerce.number().optional(),
  supervisorApproved: z.boolean().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

export type TaskQueryParams = z.infer<typeof taskQuerySchema>;

export const userQuerySchema = pageQuerySchema.extend({
  role: z.enum(['student', 'supervisor', 'school', 'admin']).optional(),
  organization: z.string().optional(),
  emailVerified: z.boolean().optional(),
});

export type UserQueryParams = z.infer<typeof userQuerySchema>;

// Add similar for other entities as needed
export const timeLogQuerySchema = pageQuerySchema.extend({
  status: z.string().optional(),
  userId: z.coerce.number().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});
export type TimeLogQueryParams = z.infer<typeof timeLogQuerySchema>;

export const scrumQuerySchema = pageQuerySchema.extend({
  userId: z.coerce.number().optional(),
  date: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  isApproved: z.boolean().optional(),
});
export type ScrumQueryParams = z.infer<typeof scrumQuerySchema>;

