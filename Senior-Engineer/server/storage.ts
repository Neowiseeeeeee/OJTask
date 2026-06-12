import {
  users, spaces, spaceMembers, groups, timeLogs, scrums, tasks, taskAssignees, attendance, documents, messages,
  evaluations, leaveRequests, announcements,
  User, InsertUser, Space, InsertSpace, SpaceMember, InsertSpaceMember, Group, InsertGroup,
  TimeLog, InsertTimeLog, Scrum, InsertScrum, Task, InsertTask, TaskAssignee, InsertTaskAssignee, Attendance, InsertAttendance,
  Document, InsertDocument, Message, InsertMessage,
  Evaluation, InsertEvaluation, LeaveRequest, InsertLeaveRequest, Announcement, InsertAnnouncement
} from "@shared/schema";

export interface IStorage {
  // Auth
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;

  // Spaces
  getSpaces(): Promise<Space[]>;
  getSpace(id: number): Promise<Space | undefined>;
  createSpace(space: InsertSpace): Promise<Space>;
  updateSpace(id: number, updates: Partial<InsertSpace>): Promise<Space | undefined>;
  joinSpace(spaceId: number, userId: number, role: string): Promise<SpaceMember>;
  getSpaceMembers(spaceId: number): Promise<SpaceMember[]>;
  getUserSpaces(userId: number): Promise<Space[]>;
  leaveSpace(spaceId: number, userId: number): Promise<void>;

  // Groups
  getGroups(spaceId: number): Promise<Group[]>;
  createGroup(group: InsertGroup): Promise<Group>;

  // Time Logs
  getTimeLogs(spaceId: number): Promise<TimeLog[]>;
  createTimeLog(log: InsertTimeLog): Promise<TimeLog>;
  approveTimeLog(id: number): Promise<TimeLog | undefined>;

  // Scrums
  getScrums(spaceId: number, userId?: number, date?: string): Promise<Scrum[]>;
  createScrum(scrum: InsertScrum): Promise<Scrum>;
  approveScrum(id: number): Promise<Scrum | undefined>;

  // Tasks
  getTasks(spaceId: number): Promise<Task[]>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, updates: Partial<InsertTask>): Promise<Task | undefined>;
  deleteTask(id: number): Promise<void>;
  getTaskAssignees(taskId: number): Promise<TaskAssignee[]>;
  addTaskAssignee(taskId: number, userId: number): Promise<TaskAssignee>;
  removeTaskAssignee(taskId: number, userId: number): Promise<void>;
  clearTaskAssignees(taskId: number): Promise<void>;

  // Attendance
  getAttendance(spaceId: number): Promise<Attendance[]>;
  createAttendance(attendance: InsertAttendance): Promise<Attendance>;

  // Documents
  getDocuments(spaceId: number): Promise<Document[]>;
  createDocument(doc: InsertDocument): Promise<Document>;
  approveDocument(id: number): Promise<Document | undefined>;
  rejectDocument(id: number): Promise<Document | undefined>;

  // Messages
  getMessages(spaceId: number, channelId?: string): Promise<Message[]>;
  markAsRead(spaceId: number, channelId: string, userId: number): Promise<void>;
  getUnreadCount(spaceId: number, userId: number): Promise<number>;
  createMessage(msg: InsertMessage): Promise<Message>;

  // Evaluations
  getEvaluations(spaceId: number): Promise<Evaluation[]>;
  createEvaluation(ev: InsertEvaluation): Promise<Evaluation>;

  // Leave Requests
  getLeaveRequests(spaceId: number): Promise<LeaveRequest[]>;
  createLeaveRequest(lr: InsertLeaveRequest): Promise<LeaveRequest>;
  approveLeaveRequest(id: number): Promise<LeaveRequest | undefined>;
  rejectLeaveRequest(id: number): Promise<LeaveRequest | undefined>;

  // Announcements
  getAnnouncements(spaceId: number): Promise<Announcement[]>;
  createAnnouncement(ann: InsertAnnouncement): Promise<Announcement>;

  // System Logs
  logSystemEvent(type: string, userId: number | null, details: Record<string, any>): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private spaces: Map<number, Space>;
  private spaceMembers: Map<number, SpaceMember>;
  private groups: Map<number, Group>;
  private timeLogs: Map<number, TimeLog>;
  private scrums: Map<number, Scrum>;
  private tasks: Map<number, Task>;
  private taskAssignees: Map<number, TaskAssignee>;
  private attendance: Map<number, Attendance>;
  private documents: Map<number, Document>;
  private messages: Map<number, Message>;
  private evaluations: Map<number, Evaluation>;
  private leaveRequests: Map<number, LeaveRequest>;
  private announcements: Map<number, Announcement>;

  private currentIds: { [key: string]: number };

  constructor() {
    this.users = new Map();
    this.spaces = new Map();
    this.spaceMembers = new Map();
    this.groups = new Map();
    this.timeLogs = new Map();
    this.scrums = new Map();
    this.tasks = new Map();
    this.taskAssignees = new Map();
    this.attendance = new Map();
    this.documents = new Map();
    this.messages = new Map();
    this.evaluations = new Map();
    this.leaveRequests = new Map();
    this.announcements = new Map();
    (this as any).systemLogs = [];

    this.currentIds = {
      user: 1, space: 1, spaceMember: 1, group: 1, timeLog: 1, scrum: 1, task: 1,
      taskAssignee: 1, attendance: 1, document: 1, message: 1, evaluation: 1, leaveRequest: 1, announcement: 1
    };
  }

  // Auth
  async getUser(id: number): Promise<User | undefined> { return this.users.get(id); }
  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    const updated = { ...user, ...updates, updatedAt: new Date() };
    this.users.set(id, updated);
    return updated;
  }
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(u => u.username === username);
  }
  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentIds.user++;
    const user: User = {
      id,
      username: insertUser.username,
      password: insertUser.password,
      role: insertUser.role,
      name: insertUser.name,
      firstName: insertUser.firstName ?? null,
      lastName: insertUser.lastName ?? null,
      email: insertUser.email ?? null,
      organization: insertUser.organization ?? null,
      profilePicture: insertUser.profilePicture ?? null,
      createdAt: insertUser.createdAt ?? new Date(),
      updatedAt: insertUser.updatedAt ?? new Date(),
      emailVerified: insertUser.emailVerified ?? false,
    };
    this.users.set(id, user);
    return user;
  }

  // Spaces
  async getSpaces(): Promise<Space[]> { return Array.from(this.spaces.values()); }
  async getSpace(id: number): Promise<Space | undefined> { return this.spaces.get(id); }
  async createSpace(insertSpace: InsertSpace): Promise<Space> {
    const id = this.currentIds.space++;
    const space: Space = {
      ...insertSpace, id,
      joinCode: insertSpace.joinCode ?? Math.random().toString(36).substring(7),
      targetHours: insertSpace.targetHours ?? 486
    };
    this.spaces.set(id, space);
    return space;
  }
  async updateSpace(id: number, updates: Partial<InsertSpace>): Promise<Space | undefined> {
    const space = this.spaces.get(id);
    if (!space) return undefined;
    const updated = { ...space, ...updates };
    this.spaces.set(id, updated);
    return updated;
  }
  async joinSpace(spaceId: number, userId: number, role: string): Promise<SpaceMember> {
    const id = this.currentIds.spaceMember++;
    const member: SpaceMember = { id, spaceId, userId, role };
    this.spaceMembers.set(id, member);
    return member;
  }
  async getSpaceMembers(spaceId: number): Promise<SpaceMember[]> {
    return Array.from(this.spaceMembers.values()).filter(m => m.spaceId === spaceId);
  }
  async getUserSpaces(userId: number): Promise<Space[]> {
    const members = Array.from(this.spaceMembers.values()).filter(m => m.userId === userId);
    return Array.from(this.spaces.values()).filter(s => members.some(m => m.spaceId === s.id) || s.ownerId === userId);
  }

  async leaveSpace(spaceId: number, userId: number): Promise<void> {
    // Find and remove the space member
    const members = Array.from(this.spaceMembers.values());
    const memberToRemove = members.find(m => m.spaceId === spaceId && m.userId === userId);
    
    if (memberToRemove) {
      this.spaceMembers.delete(memberToRemove.id);
    }
    
    // If user is the space owner, delete the entire space
    const space = this.spaces.get(spaceId);
    if (space && space.ownerId === userId) {
      // Remove all members of this space
      const spaceMembersToRemove = members.filter(m => m.spaceId === spaceId);
      for (const member of spaceMembersToRemove) {
        this.spaceMembers.delete(member.id);
      }
      
      // Remove the space
      this.spaces.delete(spaceId);
      
      // Remove all related data (tasks, scrums, etc.)
      const relatedData = [
        this.tasks, this.scrums, this.timeLogs, this.attendance,
        this.documents, this.messages, this.evaluations,
        this.leaveRequests, this.announcements
      ];
      
      for (const dataMap of relatedData) {
        const toRemove = Array.from(dataMap.values()).filter(item => {
          if ('spaceId' in item) return item.spaceId === spaceId;
          return false;
        });
        for (const item of toRemove) {
          dataMap.delete(item.id);
        }
      }
    }
  }

  // Groups
  async getGroups(spaceId: number): Promise<Group[]> {
    return Array.from(this.groups.values()).filter(g => g.spaceId === spaceId);
  }
  async createGroup(insertGroup: InsertGroup): Promise<Group> {
    const id = this.currentIds.group++;
    const group: Group = { ...insertGroup, id };
    this.groups.set(id, group);
    return group;
  }

  // Time Logs
  async getTimeLogs(spaceId: number): Promise<TimeLog[]> {
    return Array.from(this.timeLogs.values()).filter(t => t.spaceId === spaceId);
  }
  async createTimeLog(insertTimeLog: InsertTimeLog): Promise<TimeLog> {
    const id = this.currentIds.timeLog++;
    const log: TimeLog = { ...insertTimeLog, id, status: 'pending', taskId: insertTimeLog.taskId ?? null };
    this.timeLogs.set(id, log);
    return log;
  }
  async approveTimeLog(id: number): Promise<TimeLog | undefined> {
    const log = this.timeLogs.get(id);
    if (!log) return undefined;
    const updated = { ...log, status: 'approved' };
    this.timeLogs.set(id, updated);
    return updated;
  }

  // Scrums
  async getScrums(spaceId: number, userId?: number, date?: string): Promise<Scrum[]> {
    let scrums = Array.from(this.scrums.values()).filter(s => s.spaceId === spaceId);
    if (userId) scrums = scrums.filter(s => s.userId === userId);
    if (date) scrums = scrums.filter(s => s.date === date);
    return scrums;
  }
  async createScrum(insertScrum: InsertScrum): Promise<Scrum> {
    const id = this.currentIds.scrum++;
    const scrum: Scrum = { ...insertScrum, id, isApproved: false, completionPercentage: 0 };
    this.scrums.set(id, scrum);
    return scrum;
  }
  async approveScrum(id: number): Promise<Scrum | undefined> {
    const scrum = this.scrums.get(id);
    if (!scrum) return undefined;
    const updated = { ...scrum, isApproved: true };
    this.scrums.set(id, updated);
    return updated;
  }

  // Tasks
  async getTasks(spaceId: number): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(t => t.spaceId === spaceId);
  }
  async createTask(insertTask: InsertTask): Promise<Task> {
    const id = this.currentIds.task++;
    const task: Task = {
      ...insertTask, id,
      description: insertTask.description ?? null,
      assignedToId: insertTask.assignedToId ?? null,
      groupId: insertTask.groupId ?? null,
      supervisorApproved: false
    };
    this.tasks.set(id, task);
    return task;
  }
  async updateTask(id: number, updates: Partial<InsertTask>): Promise<Task | undefined> {
    const task = this.tasks.get(id);
    if (!task) return undefined;
    const updated = { ...task, ...updates };
    this.tasks.set(id, updated as Task);
    return updated as Task;
  }
  async deleteTask(id: number): Promise<void> { 
    this.tasks.delete(id);
    // Remove all assignees for this task
    Array.from(this.taskAssignees.entries()).forEach(([assigneeId, assignee]) => {
      if (assignee.taskId === id) this.taskAssignees.delete(assigneeId);
    });
  }

  async getTaskAssignees(taskId: number): Promise<TaskAssignee[]> {
    return Array.from(this.taskAssignees.values()).filter(a => a.taskId === taskId);
  }

  async addTaskAssignee(taskId: number, userId: number): Promise<TaskAssignee> {
    const id = this.currentIds.taskAssignee++;
    const assignee: TaskAssignee = { id, taskId, userId };
    this.taskAssignees.set(id, assignee);
    return assignee;
  }

  async removeTaskAssignee(taskId: number, userId: number): Promise<void> {
    Array.from(this.taskAssignees.entries()).forEach(([id, assignee]) => {
      if (assignee.taskId === taskId && assignee.userId === userId) {
        this.taskAssignees.delete(id);
      }
    });
  }

  async clearTaskAssignees(taskId: number): Promise<void> {
    Array.from(this.taskAssignees.entries()).forEach(([id, assignee]) => {
      if (assignee.taskId === taskId) this.taskAssignees.delete(id);
    });
  }

  // Attendance
  async getAttendance(spaceId: number): Promise<Attendance[]> {
    return Array.from(this.attendance.values()).filter(a => a.spaceId === spaceId);
  }
  async createAttendance(insertAttendance: InsertAttendance): Promise<Attendance> {
    const id = this.currentIds.attendance++;
    const att: Attendance = { ...insertAttendance, id };
    this.attendance.set(id, att);
    return att;
  }

  // Documents
  async getDocuments(spaceId: number): Promise<Document[]> {
    return Array.from(this.documents.values()).filter(d => d.spaceId === spaceId);
  }
  async createDocument(insertDoc: InsertDocument): Promise<Document> {
    const id = this.currentIds.document++;
    const doc: Document = { ...insertDoc, id, status: 'submitted', uploadDate: new Date().toISOString().split('T')[0] };
    this.documents.set(id, doc);
    return doc;
  }
  async approveDocument(id: number): Promise<Document | undefined> {
    const doc = this.documents.get(id);
    if (!doc) return undefined;
    const updated = { ...doc, status: 'approved' };
    this.documents.set(id, updated);
    return updated;
  }
  async rejectDocument(id: number): Promise<Document | undefined> {
    const doc = this.documents.get(id);
    if (!doc) return undefined;
    const updated = { ...doc, status: 'rejected' };
    this.documents.set(id, updated);
    return updated;
  }

  // Messages (in-memory)
  async getMessages(spaceId: number, channelId?: string): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(m => m.spaceId === spaceId && (!channelId || m.channelId === channelId))
      .sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''));
  }
  
  async createMessage(insertMsg: InsertMessage): Promise<Message> {
    const id = this.currentIds.message++;
    const msg: Message = {
      id,
      spaceId: insertMsg.spaceId,
      userId: insertMsg.userId,
      channelId: insertMsg.channelId ?? 'general',
      content: insertMsg.content,
      createdAt: new Date().toISOString(),
    };
    this.messages.set(id, msg);
    return msg;
  }

  // Evaluations
  async getEvaluations(spaceId: number): Promise<Evaluation[]> {
    return Array.from(this.evaluations.values()).filter(e => e.spaceId === spaceId);
  }
  async createEvaluation(ev: InsertEvaluation): Promise<Evaluation> {
    const id = this.currentIds.evaluation++;
    const evaluation: Evaluation = { ...ev, id, comments: ev.comments ?? '' };
    this.evaluations.set(id, evaluation);
    return evaluation;
  }

  // Leave Requests
  async getLeaveRequests(spaceId: number): Promise<LeaveRequest[]> {
    return Array.from(this.leaveRequests.values()).filter(l => l.spaceId === spaceId);
  }
  async createLeaveRequest(lr: InsertLeaveRequest): Promise<LeaveRequest> {
    const id = this.currentIds.leaveRequest++;
    const req: LeaveRequest = { ...lr, id, status: 'pending' };
    this.leaveRequests.set(id, req);
    return req;
  }
  async approveLeaveRequest(id: number): Promise<LeaveRequest | undefined> {
    const req = this.leaveRequests.get(id);
    if (!req) return undefined;
    const updated = { ...req, status: 'approved' };
    this.leaveRequests.set(id, updated);
    return updated;
  }
  async rejectLeaveRequest(id: number): Promise<LeaveRequest | undefined> {
    const req = this.leaveRequests.get(id);
    if (!req) return undefined;
    const updated = { ...req, status: 'rejected' };
    this.leaveRequests.set(id, updated);
    return updated;
  }

  // Announcements
  async getAnnouncements(spaceId: number): Promise<Announcement[]> {
    return Array.from(this.announcements.values()).filter(a => a.spaceId === spaceId);
  }
  async createAnnouncement(ann: InsertAnnouncement): Promise<Announcement> {
    const id = this.currentIds.announcement++;
    const announcement: Announcement = { ...ann, id };
    this.announcements.set(id, announcement);
    return announcement;
  }

  // System Logs
  async logSystemEvent(type: string, userId: number | null, details: Record<string, any>): Promise<void> {
    const systemLogs = (this as any).systemLogs || [];
    systemLogs.push({
      id: `${Date.now()}-${Math.random()}`,
      timestamp: new Date().toISOString(),
      type,
      userId,
      details
    });
    (this as any).systemLogs = systemLogs;
  }

  async getSystemLogs(limit: number = 100): Promise<any[]> {
    const systemLogs = (this as any).systemLogs || [];
    return systemLogs.slice(-limit).reverse();
  }

  // Analytics
  async getUserStats(): Promise<{ total: number; byRole: Record<string, number>; newThisWeek: number }> {
    const allUsers = Array.from(this.users.values());
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const newThisWeek = 0; // Would be calculated from registration dates
    
    const byRole = { student: 0, supervisor: 0, school: 0, admin: 0 };
    allUsers.forEach(u => {
      byRole[u.role as keyof typeof byRole] = (byRole[u.role as keyof typeof byRole] || 0) + 1;
    });

    return {
      total: allUsers.length,
      byRole,
      newThisWeek
    };
  }

  async getSpaceStats(): Promise<{ total: number; byType: Record<string, number> }> {
    const allSpaces = Array.from(this.spaces.values());
    const byType = { official: 0, private: 0 };
    allSpaces.forEach(s => {
      byType[s.type as keyof typeof byType]++;
    });
    return {
      total: allSpaces.length,
      byType
    };
  }

  async getUsersWithStats(): Promise<Array<User & { spacesCount: number; lastLogin: string | null }>> {
    return Array.from(this.users.values()).map(user => ({
      ...user,
      spacesCount: Array.from(this.spaceMembers.values()).filter(m => m.userId === user.id).length,
      lastLogin: null // Would be tracked in system logs
    }));
  }

  async getSpacesWithStats(): Promise<Array<Space & { memberCount: number; ownerName: string | null }>> {
    return Array.from(this.spaces.values()).map(space => {
      const memberCount = Array.from(this.spaceMembers.values()).filter(m => m.spaceId === space.id).length;
      const owner = this.users.get(space.ownerId);
      return {
        ...space,
        memberCount,
        ownerName: owner?.name || null
      };
    });
  }
}

// Initialize MongoDB storage
import { MongoStorage } from "./mongo-storage";
import { FileStorage } from "./file-storage";
let storageInstance: IStorage | null = null;

export async function initStorage(): Promise<IStorage> {
  if (storageInstance) return storageInstance;
  
  // MongoDB Atlas Only - No fallbacks for cloud-only storage
  console.log('🔄 Initializing MongoDB Atlas storage (CLOUD ONLY)...');
  
  try {
    const mongoStorage = new MongoStorage();
    await mongoStorage.initCollections();
    storageInstance = mongoStorage;
    console.log('✅ MongoDB Atlas storage initialized successfully - CLOUD DATABASE');
    return storageInstance;
  } catch (mongoError) {
    console.error('❌ MongoDB Atlas connection failed:', mongoError);
    console.error('❌ CLOUD STORAGE REQUIRED - No offline fallbacks available');
    console.error('❌ Please check your MongoDB Atlas connection and try again');
    throw new Error('MongoDB Atlas connection required. Cloud storage is mandatory.');
  }
}

export function getStorage(): IStorage {
  if (!storageInstance) {
    throw new Error('Storage not initialized. Call initStorage() first.');
  }
  return storageInstance;
}
