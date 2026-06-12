import { getDB } from "./db";
import { Db, ObjectId, Collection } from "mongodb";
import {
  User, Space, SpaceMember, Group, TimeLog, Scrum, Task, TaskAssignee, 
  Attendance, Document, Message, Evaluation, LeaveRequest, Announcement,
  InsertUser, InsertSpace, InsertSpaceMember, InsertGroup, InsertTimeLog,
  InsertScrum, InsertTask, InsertTaskAssignee, InsertAttendance, InsertDocument,
  InsertMessage, InsertEvaluation, InsertLeaveRequest, InsertAnnouncement
} from "@shared/schema";
import { IStorage } from "./storage";

export class MongoStorage implements IStorage {
  private db!: Db;

  async initCollections() {
    this.db = getDB();
    const dbName = this.db.databaseName;
    console.log(`🗄️  Using database: ${dbName}`);
    
    const collections = await this.db.listCollections().toArray();
    const collectionNames = collections.map((c: any) => c.name);

    // Create indexes for frequently queried fields
    const collectionSetup = [
      { name: 'users', indexes: [{ key: { username: 1 }, unique: true }] },
      { name: 'spaces', indexes: [{ key: { ownerId: 1 } }] },
      { name: 'spaceMembers', indexes: [{ key: { spaceId: 1 } }, { key: { userId: 1 } }] },
      { name: 'tasks', indexes: [{ key: { spaceId: 1 } }] },
      { name: 'taskAssignees', indexes: [{ key: { taskId: 1 } }, { key: { userId: 1 } }] },
      { name: 'timeLogs', indexes: [{ key: { spaceId: 1 } }] },
      { name: 'scrums', indexes: [{ key: { spaceId: 1 } }, { key: { userId: 1 } }] },
      { name: 'attendance', indexes: [{ key: { spaceId: 1 } }] },
      { name: 'documents', indexes: [{ key: { spaceId: 1 } }] },
      { name: 'messages', indexes: [{ key: { spaceId: 1 } }] },
      { name: 'evaluations', indexes: [{ key: { spaceId: 1 } }] },
      { name: 'leaveRequests', indexes: [{ key: { spaceId: 1 } }] },
      { name: 'announcements', indexes: [{ key: { spaceId: 1 } }] },
      { name: 'groups', indexes: [{ key: { spaceId: 1 } }] },
      { name: 'notifications', indexes: [{ key: { userId: 1 } }, { key: { spaceId: 1 } }] },
    ];

    for (const { name, indexes } of collectionSetup) {
      if (!collectionNames.includes(name)) {
        await this.db.createCollection(name);
        console.log(`✓ Created collection: ${name}`);
      }
      
      // Create indexes
      for (const indexConfig of indexes) {
        try {
          await this.db.collection(name).createIndex(indexConfig.key, { unique: (indexConfig as any).unique ?? false });
        } catch (err) {
          // Index might already exist, ignore
        }
      }
    }
  }

  async initializeCounters() {
    // Initialize ID counters based on max existing IDs in each collection
    const types = [
      { type: 'user', collection: 'users' },
      { type: 'space', collection: 'spaces' },
      { type: 'spaceMember', collection: 'spaceMembers' },
      { type: 'task', collection: 'tasks' },
      { type: 'group', collection: 'groups' },
      { type: 'timeLog', collection: 'timeLogs' },
      { type: 'scrum', collection: 'scrums' },
      { type: 'attendance', collection: 'attendance' },
      { type: 'document', collection: 'documents' },
      { type: 'message', collection: 'messages' },
      { type: 'evaluation', collection: 'evaluations' },
      { type: 'leaveRequest', collection: 'leaveRequests' },
      { type: 'announcement', collection: 'announcements' },
      { type: 'taskAssignee', collection: 'taskAssignees' },
      { type: 'notification', collection: 'notifications' },
    ];

    for (const { type, collection } of types) {
      try {
        // Find max existing ID in collection - explicitly fetch and check
        const docs = await this.db.collection(collection).find({}).sort({ id: -1 }).limit(1).toArray();
        const maxId = (docs.length > 0 && docs[0].id) ? docs[0].id : 0;
        
        console.log(`[INIT_COUNTER] Collection '${collection}': max ID=${maxId}`);
        
        // Set counter to maxId (so next will be maxId + 1)
        await this.db.collection('_idCounters').updateOne(
          { type },
          { $set: { type, count: maxId } },
          { upsert: true }
        );
        console.log(`[INIT_COUNTER] Initialized '${type}' counter to ${maxId}`);
      } catch (e) {
        console.log(`[COUNTER] Could not initialize counter for ${type}:`, e);
      }
    }
    console.log('✓ ID counters initialized');
  }

  // Auth
  async getUser(id: number): Promise<User | undefined> {
    const user = await this.db.collection('users').findOne({ id });
    return user ? this.toUser(user) : undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const user = await this.db.collection('users').findOne({ username });
    return user ? this.toUser(user) : undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = await this.getNextId('user');
    const user = {
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
      createdAt: new Date(),
      updatedAt: new Date(),
      emailVerified: insertUser.emailVerified ?? false,
    };
    await this.db.collection('users').insertOne(user);
    return this.toUser(user);
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const updateResult = await this.db.collection('users').updateOne(
      { id },
      { $set: { ...updates, updatedAt: new Date() } }
    );
    
    if (updateResult.matchedCount === 0) {
      console.log(`[UPDATE_USER] User id=${id} not found`);
      return undefined;
    }
    
    // Fetch the updated user
    const user = await this.db.collection('users').findOne({ id });
    return user ? this.toUser(user) : undefined;
  }

  // Spaces
  async getSpaces(): Promise<Space[]> {
    const spaces = await this.db.collection('spaces').find({}).toArray();
    return spaces.map(s => this.toSpace(s));
  }

  async getSpace(id: number): Promise<Space | undefined> {
    const space = await this.db.collection('spaces').findOne({ id });
    return space ? this.toSpace(space) : undefined;
  }

  async createSpace(insertSpace: InsertSpace): Promise<Space> {
    const id = await this.getNextId('space');
    const space = {
      id,
      name: insertSpace.name,
      type: insertSpace.type,
      joinCode: insertSpace.joinCode ?? this.generateJoinCode(),
      ownerId: insertSpace.ownerId,
      targetHours: insertSpace.targetHours ?? 486,
    };
    await this.db.collection('spaces').insertOne(space);
    return this.toSpace(space);
  }

  async updateSpace(id: number, updates: Partial<InsertSpace>): Promise<Space | undefined> {
    const result = await this.db.collection('spaces').findOneAndUpdate(
      { id },
      { $set: updates },
      { returnDocument: 'after' }
    );
    return result ? this.toSpace(result) : undefined;
  }

  async joinSpace(spaceId: number, userId: number, role: string): Promise<SpaceMember> {
    const id = await this.getNextId('spaceMember');
    const member = { id, spaceId, userId, role };
    await this.db.collection('spaceMembers').insertOne(member);
    return this.toSpaceMember(member);
  }

  async getSpaceMembers(spaceId: number): Promise<SpaceMember[]> {
    const members = await this.db.collection('spaceMembers').find({ spaceId }).toArray();
    return members.map(m => this.toSpaceMember(m));
  }

  async getUserSpaces(userId: number): Promise<Space[]> {
    const members = await this.db.collection('spaceMembers').find({ userId }).toArray();
    const spaceIds = members.map(m => m.spaceId);
    const spaces = await this.db.collection('spaces').find({
      $or: [{ id: { $in: spaceIds } }, { ownerId: userId }]
    }).toArray();
    return spaces.map(s => this.toSpace(s));
  }

  async leaveSpace(spaceId: number, userId: number): Promise<void> {
    // Remove space member
    await this.db.collection('spaceMembers').deleteMany({ spaceId: spaceId, userId: userId });
    
    // Check if user is the space owner
    const space = await this.db.collection('spaces').findOne({ id: spaceId });
    if (space && space.ownerId === userId) {
      // User is owner - delete entire space and all related data
      await this.db.collection('spaces').deleteOne({ id: spaceId });
      
      // Delete all related data in batches
      const collections = [
        'spaceMembers', 'groups', 'tasks', 'taskAssignees',
        'timeLogs', 'scrums', 'attendance', 'documents',
        'messages', 'evaluations', 'leaveRequests', 'announcements'
      ];
      
      for (const collectionName of collections) {
        await this.db.collection(collectionName).deleteMany({ spaceId: spaceId });
      }
    }
  }

  // Groups
  async getGroups(spaceId: number): Promise<Group[]> {
    const groups = await this.db.collection('groups').find({ spaceId }).toArray();
    return groups.map(g => this.toGroup(g));
  }

  async createGroup(insertGroup: InsertGroup): Promise<Group> {
    const id = await this.getNextId('group');
    const group = { id, spaceId: insertGroup.spaceId, name: insertGroup.name };
    await this.db.collection('groups').insertOne(group);
    return this.toGroup(group);
  }

  // Time Logs
  async getTimeLogs(spaceId: number): Promise<TimeLog[]> {
    const logs = await this.db.collection('timeLogs').find({ spaceId }).toArray();
    return logs.map(l => this.toTimeLog(l));
  }

  async createTimeLog(insertTimeLog: InsertTimeLog): Promise<TimeLog> {
    const id = await this.getNextId('timeLog');
    const log = {
      id,
      spaceId: insertTimeLog.spaceId,
      userId: insertTimeLog.userId,
      date: insertTimeLog.date,
      hours: insertTimeLog.hours,
      taskId: insertTimeLog.taskId ?? null,
      description: (insertTimeLog as any).description ?? null,
      status: 'pending',
    };
    await this.db.collection('timeLogs').insertOne(log);
    return this.toTimeLog(log);
  }

  async approveTimeLog(id: number): Promise<TimeLog | undefined> {
    const result = await this.db.collection('timeLogs').findOneAndUpdate(
      { id },
      { $set: { status: 'approved' } },
      { returnDocument: 'after' }
    );
    return result ? this.toTimeLog(result) : undefined;
  }

  // Scrums
  async getScrums(spaceId: number, userId?: number, date?: string): Promise<Scrum[]> {
    const filter: any = { spaceId };
    if (userId) filter.userId = userId;
    if (date) filter.date = date;
    const scrums = await this.db.collection('scrums').find(filter).toArray();
    return scrums.map(s => this.toScrum(s));
  }

  async createScrum(insertScrum: InsertScrum): Promise<Scrum> {
    const id = await this.getNextId('scrum');
    const scrum = {
      id,
      spaceId: insertScrum.spaceId,
      userId: insertScrum.userId,
      date: insertScrum.date,
      taskYesterdayPlanned: insertScrum.taskYesterdayPlanned,
      taskYesterdayCompleted: insertScrum.taskYesterdayCompleted,
      taskTodayPlanned: insertScrum.taskTodayPlanned,
      taskTodayCompleted: insertScrum.taskTodayCompleted,
      whatNext: insertScrum.whatNext,
      timeSpent: insertScrum.timeSpent,
      reflection: insertScrum.reflection,
      completionPercentage: insertScrum.completionPercentage ?? 0,
      isApproved: false,
    };
    await this.db.collection('scrums').insertOne(scrum);
    return this.toScrum(scrum);
  }

  async approveScrum(id: number): Promise<Scrum | undefined> {
    const result = await this.db.collection('scrums').findOneAndUpdate(
      { id },
      { $set: { isApproved: true } },
      { returnDocument: 'after' }
    );
    return result ? this.toScrum(result) : undefined;
  }

  // Tasks
  async getTasks(spaceId: number): Promise<Task[]> {
    const tasks = await this.db.collection('tasks').find({ spaceId }).toArray();
    return tasks.map(t => this.toTask(t));
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const id = await this.getNextId('task');
    const task = {
      id,
      spaceId: insertTask.spaceId,
      title: insertTask.title,
      description: insertTask.description ?? null,
      type: insertTask.type,
      status: insertTask.status,
      assignedToId: insertTask.assignedToId ?? null,
      groupId: insertTask.groupId ?? null,
      authorId: insertTask.authorId,
      supervisorApproved: false,
    };
    await this.db.collection('tasks').insertOne(task);
    return this.toTask(task);
  }

  async updateTask(id: number, updates: Partial<InsertTask>): Promise<Task | undefined> {
    const result = await this.db.collection('tasks').findOneAndUpdate(
      { id },
      { $set: updates },
      { returnDocument: 'after' }
    );
    return result ? this.toTask(result) : undefined;
  }

  async deleteTask(id: number): Promise<void> {
    await this.db.collection('tasks').deleteOne({ id });
    await this.db.collection('taskAssignees').deleteMany({ taskId: id });
  }

  async getTaskAssignees(taskId: number): Promise<TaskAssignee[]> {
    const assignees = await this.db.collection('taskAssignees').find({ taskId }).toArray();
    return assignees.map(a => this.toTaskAssignee(a));
  }

  async addTaskAssignee(taskId: number, userId: number): Promise<TaskAssignee> {
    const id = await this.getNextId('taskAssignee');
    const assignee = { id, taskId, userId };
    await this.db.collection('taskAssignees').insertOne(assignee);
    return this.toTaskAssignee(assignee);
  }

  async removeTaskAssignee(taskId: number, userId: number): Promise<void> {
    await this.db.collection('taskAssignees').deleteOne({ taskId, userId });
  }

  async clearTaskAssignees(taskId: number): Promise<void> {
    await this.db.collection('taskAssignees').deleteMany({ taskId });
  }

  // Attendance
  async getAttendance(spaceId: number): Promise<Attendance[]> {
    const attendance = await this.db.collection('attendance').find({ spaceId }).toArray();
    return attendance.map(a => this.toAttendance(a));
  }

  async createAttendance(insertAttendance: InsertAttendance): Promise<Attendance> {
    const id = await this.getNextId('attendance');
    const att = {
      id,
      spaceId: insertAttendance.spaceId,
      userId: insertAttendance.userId,
      date: insertAttendance.date,
      status: insertAttendance.status,
    };
    await this.db.collection('attendance').insertOne(att);
    return this.toAttendance(att);
  }

  // Documents
  async getDocuments(spaceId: number): Promise<Document[]> {
    const docs = await this.db.collection('documents').find({ spaceId }).toArray();
    return docs.map(d => this.toDocument(d));
  }

  async getAllDocuments(): Promise<Document[]> {
    const docs = await this.db.collection('documents').find({}).toArray();
    return docs.map(d => this.toDocument(d));
  }

  async createDocument(insertDoc: any): Promise<Document> {
    const id = await this.getNextId('document');
    const today = new Date().toISOString().split("T")[0];
    const doc = {
      id,
      spaceId: insertDoc.spaceId,
      uploaderId: insertDoc.uploaderId,
      name: insertDoc.name,
      type: insertDoc.type ?? 'requirement',
      documentType: insertDoc.documentType ?? '',
      uploadDate: insertDoc.uploadDate ?? today,
      status: insertDoc.status ?? 'submitted',
      fileData: insertDoc.fileData ?? null,
      filePath: insertDoc.filePath ?? null,
      fileSize: insertDoc.fileSize ?? null,
      mimeType: insertDoc.mimeType ?? null,
      notes: insertDoc.notes ?? null,
      isRequired: insertDoc.isRequired ?? false,
      deadline: insertDoc.deadline ?? null,
      createdAt: new Date(),
    };
    await this.db.collection('documents').insertOne(doc);
    return this.toDocument(doc);
  }

  async approveDocument(id: number): Promise<Document | undefined> {
    const result = await this.db.collection('documents').findOneAndUpdate(
      { id },
      { $set: { status: 'approved', approvalStatus: 'approved', approvedDate: new Date().toISOString().split("T")[0] } },
      { returnDocument: 'after' }
    );
    return result ? this.toDocument(result) : undefined;
  }

  async rejectDocument(id: number): Promise<Document | undefined> {
    const result = await this.db.collection('documents').findOneAndUpdate(
      { id },
      { $set: { status: 'rejected', approvalStatus: 'rejected' } },
      { returnDocument: 'after' }
    );
    return result ? this.toDocument(result) : undefined;
  }

  // Messages
  async getMessages(spaceId: number, channelId?: string): Promise<Message[]> {
    const filter: any = { spaceId };
    if (channelId) filter.channelId = channelId;
    const messages = await this.db.collection('messages').find(filter).toArray();
    return messages.map(m => this.toMessage(m));
  }

  async createMessage(insertMsg: InsertMessage): Promise<Message> {
    const id = await this.getNextId('message');
    const msg = {
      id,
      spaceId: insertMsg.spaceId,
      senderId: insertMsg.senderId,
      recipientId: (insertMsg as any).recipientId ?? 0,
      channelId: insertMsg.channelId ?? 'general',
      content: insertMsg.content,
      timestamp: new Date().toISOString(),
      isRead: false,
      status: 'sent',
    };
    await this.db.collection('messages').insertOne(msg);
    return this.toMessage(msg);
  }

  // Public channels tracked by last-read timestamp (recipientId is 0 for broadcasts)
  private readonly PUBLIC_CHANNELS = ['general', 'chill'];

  async markAsRead(spaceId: number, channelId: string, userId: number): Promise<void> {
    if (this.PUBLIC_CHANNELS.includes(channelId)) {
      // Public channel: record when this user last read it
      await this.db.collection('channelReads').updateOne(
        { spaceId, channelId, userId },
        { $set: { lastReadAt: new Date().toISOString() } },
        { upsert: true }
      );
    } else {
      // DM: mark individual message documents as read
      await this.db.collection('messages').updateMany(
        { spaceId, channelId, recipientId: userId, isRead: false },
        { $set: { isRead: true, status: 'seen' } }
      );
    }
  }

  async getUnreadCount(spaceId: number, userId: number): Promise<number> {
    // DM unreads
    const dmCount = await this.db.collection('messages').countDocuments({
      spaceId,
      recipientId: userId,
      isRead: false,
    });

    // Public channel unreads — any message by someone else after lastReadAt
    let publicCount = 0;
    for (const channelId of this.PUBLIC_CHANNELS) {
      const readRecord = await this.db.collection('channelReads').findOne({ spaceId, channelId, userId });
      const filter: any = { spaceId, channelId, senderId: { $ne: userId } };
      if (readRecord?.lastReadAt) filter.timestamp = { $gt: readRecord.lastReadAt };
      publicCount += await this.db.collection('messages').countDocuments(filter);
    }

    return dmCount + publicCount;
  }

  async getUnreadCountsPerChannel(spaceId: number, userId: number): Promise<Record<string, number>> {
    // DM unreads
    const result = await this.db.collection('messages').aggregate([
      { $match: { spaceId, recipientId: userId, isRead: false } },
      { $group: { _id: '$channelId', count: { $sum: 1 } } }
    ]).toArray();
    const map: Record<string, number> = {};
    for (const r of result) { if (r._id) map[r._id] = r.count; }

    // Public channel unreads
    for (const channelId of this.PUBLIC_CHANNELS) {
      const readRecord = await this.db.collection('channelReads').findOne({ spaceId, channelId, userId });
      const filter: any = { spaceId, channelId, senderId: { $ne: userId } };
      if (readRecord?.lastReadAt) filter.timestamp = { $gt: readRecord.lastReadAt };
      const count = await this.db.collection('messages').countDocuments(filter);
      if (count > 0) map[channelId] = count;
    }

    return map;
  }

  // Evaluations
  async getEvaluations(spaceId: number): Promise<Evaluation[]> {
    const evals = await this.db.collection('evaluations').find({ spaceId }).toArray();
    return evals.map(e => this.toEvaluation(e));
  }

  async createEvaluation(insertEval: InsertEvaluation): Promise<Evaluation> {
    const id = await this.getNextId('evaluation');
    const evaluation = {
      id,
      spaceId: insertEval.spaceId,
      evaluatorId: insertEval.evaluatorId,
      evaluateeId: (insertEval as any).evaluateeId,
      type: (insertEval as any).type ?? "midterm",
      punctuality: (insertEval as any).punctuality ?? 0,
      attitude: (insertEval as any).attitude ?? 0,
      technical: (insertEval as any).technical ?? 0,
      communication: (insertEval as any).communication ?? 0,
      overall: (insertEval as any).overall ?? 0,
      comments: (insertEval as any).comments ?? "",
      date: (insertEval as any).date ?? new Date().toISOString().split("T")[0],
      createdAt: new Date().toISOString(),
    };
    await this.db.collection('evaluations').insertOne(evaluation);
    return this.toEvaluation(evaluation);
  }

  // Leave Requests
  async getLeaveRequests(spaceId: number): Promise<LeaveRequest[]> {
    const reqs = await this.db.collection('leaveRequests').find({ spaceId }).toArray();
    return reqs.map(r => this.toLeaveRequest(r));
  }

  async createLeaveRequest(insertLR: InsertLeaveRequest): Promise<LeaveRequest> {
    const id = await this.getNextId('leaveRequest');
    const today = new Date().toISOString().split("T")[0];
    const lr = {
      id,
      spaceId: insertLR.spaceId,
      userId: insertLR.userId,
      date: (insertLR as any).date ?? today,
      reason: insertLR.reason,
      status: 'pending',
      createdAt: new Date(),
    };
    await this.db.collection('leaveRequests').insertOne(lr);
    return this.toLeaveRequest(lr);
  }

  async approveLeaveRequest(id: number): Promise<LeaveRequest | undefined> {
    const result = await this.db.collection('leaveRequests').findOneAndUpdate(
      { id },
      { $set: { status: 'approved' } },
      { returnDocument: 'after' }
    );
    return result ? this.toLeaveRequest(result) : undefined;
  }

  async rejectLeaveRequest(id: number): Promise<LeaveRequest | undefined> {
    const result = await this.db.collection('leaveRequests').findOneAndUpdate(
      { id },
      { $set: { status: 'rejected' } },
      { returnDocument: 'after' }
    );
    return result ? this.toLeaveRequest(result) : undefined;
  }

  // Announcements
  async getAnnouncements(spaceId: number): Promise<Announcement[]> {
    const anns = await this.db.collection('announcements').find({ spaceId }).toArray();
    const mapped = anns.map(a => this.toAnnouncement(a));
    // Deduplicate by id to prevent React key warnings from duplicate MongoDB documents
    const seen = new Set<number>();
    return mapped.filter(a => { if (seen.has(a.id)) return false; seen.add(a.id); return true; });
  }

  async createAnnouncement(insertAnn: InsertAnnouncement): Promise<Announcement> {
    const id = await this.getNextId('announcement');
    const today = new Date().toISOString().split("T")[0];
    const ann = {
      id,
      spaceId: insertAnn.spaceId,
      authorId: insertAnn.authorId,
      title: insertAnn.title,
      content: insertAnn.content,
      date: insertAnn.date || today,
      createdAt: new Date(),
    };
    await this.db.collection('announcements').insertOne(ann);
    return this.toAnnouncement(ann);
  }

  // Helper methods
  private async getNextId(type: string): Promise<number> {
    try {
      // Check if counter exists and log it
      const before = await this.db.collection('_idCounters').findOne({ type });
      console.log(`[ID_DEBUG] Before: type='${type}', counter=`, before);
      
      if (!before) {
        console.log(`[ID_DEBUG] Counter doesn't exist, creating it`);
        await this.db.collection('_idCounters').insertOne({ type, count: 0 });
      }
      
      // Use updateOne to increment (doesn't return the document)
      const updateResult = await this.db.collection('_idCounters').updateOne(
        { type },
        { $inc: { count: 1 } }
      );
      console.log(`[ID_DEBUG] updateOne result:`, { modifiedCount: updateResult.modifiedCount, matchedCount: updateResult.matchedCount });
      
      // Now fetch to get the new value
      const after = await this.db.collection('_idCounters').findOne({ type });
      const nextId = after?.count;
      
      console.log(`[ID_DEBUG] After: counter=`, after);
      
      if (!nextId || typeof nextId !== 'number') {
        console.error(`[ID_COUNTER_ERROR] Invalid counter value: ${nextId}`);
        throw new Error(`Counter value invalid for type ${type}: ${nextId}`);
      }
      
      console.log(`[ID_COUNTER] Generated ID for type '${type}': ${nextId}`);
      return nextId;
    } catch (error) {
      console.error(`[ID_COUNTER_ERROR] Failed to get next ID for type '${type}':`, error);
      throw error;
    }
  }

  private generateJoinCode(): string {
    return Math.random().toString(36).substring(2, 8);
  }

  // Type conversion methods
  private toUser(doc: any): User {
    return {
      id: doc.id,
      username: doc.username,
      password: doc.password,
      role: doc.role,
      name: doc.name,
      firstName: doc.firstName,
      lastName: doc.lastName,
      email: doc.email,
      organization: doc.organization,
      profilePicture: doc.profilePicture,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      emailVerified: doc.emailVerified,
    };
  }

  private toSpace(doc: any): Space {
    return {
      id: doc.id,
      name: doc.name,
      type: doc.type,
      joinCode: doc.joinCode,
      ownerId: doc.ownerId,
      targetHours: doc.targetHours,
    };
  }

  private toSpaceMember(doc: any): SpaceMember {
    return { id: doc.id, spaceId: doc.spaceId, userId: doc.userId, role: doc.role };
  }

  private toGroup(doc: any): Group {
    return { id: doc.id, spaceId: doc.spaceId, name: doc.name };
  }

  private toTimeLog(doc: any): TimeLog {
    return {
      id: doc.id,
      spaceId: doc.spaceId,
      userId: doc.userId,
      date: doc.date,
      hours: doc.hours,
      taskId: doc.taskId ?? null,
      description: doc.description ?? null,
      status: doc.status,
    } as any;
  }

  private toScrum(doc: any): Scrum {
    return {
      id: doc.id,
      spaceId: doc.spaceId,
      userId: doc.userId,
      date: doc.date,
      taskYesterdayPlanned: doc.taskYesterdayPlanned,
      taskYesterdayCompleted: doc.taskYesterdayCompleted,
      taskTodayPlanned: doc.taskTodayPlanned,
      taskTodayCompleted: doc.taskTodayCompleted,
      whatNext: doc.whatNext,
      timeSpent: doc.timeSpent,
      reflection: doc.reflection,
      completionPercentage: doc.completionPercentage,
      isApproved: doc.isApproved,
    };
  }

  private toTask(doc: any): Task {
    return {
      id: doc.id,
      spaceId: doc.spaceId,
      title: doc.title,
      description: doc.description,
      type: doc.type,
      status: doc.status,
      assignedToId: doc.assignedToId,
      groupId: doc.groupId,
      authorId: doc.authorId,
      supervisorApproved: doc.supervisorApproved,
    };
  }

  private toTaskAssignee(doc: any): TaskAssignee {
    return { id: doc.id, taskId: doc.taskId, userId: doc.userId };
  }

  private toAttendance(doc: any): Attendance {
    return {
      id: doc.id,
      spaceId: doc.spaceId,
      userId: doc.userId,
      date: doc.date,
      status: doc.status,
    };
  }

  private toDocument(doc: any): Document {
    const today = new Date().toISOString().split("T")[0];
    return {
      id: doc.id,
      spaceId: doc.spaceId,
      uploaderId: doc.uploaderId,
      name: doc.name,
      type: doc.type ?? 'requirement',
      documentType: doc.documentType ?? '',
      uploadDate: doc.uploadDate ?? today,
      status: doc.status ?? doc.approvalStatus ?? 'submitted',
      fileData: doc.fileData ?? null,
      filePath: doc.filePath ?? doc.url ?? null,
      fileSize: doc.fileSize ?? null,
      mimeType: doc.mimeType ?? null,
      originalFileName: doc.originalFileName ?? null,
      notes: doc.notes ?? null,
      isRequired: doc.isRequired ?? false,
      deadline: doc.deadline ?? null,
      approvedBy: doc.approvedBy ?? null,
      approvedDate: doc.approvedDate ?? null,
      rejectionReason: doc.rejectionReason ?? null,
    } as any;
  }

  private toMessage(doc: any): Message {
    return {
      id: doc.id,
      spaceId: doc.spaceId,
      senderId: doc.senderId ?? doc.userId ?? 0,
      recipientId: doc.recipientId ?? 0,
      channelId: doc.channelId,
      content: doc.content,
      timestamp: doc.timestamp ?? doc.createdAt ?? new Date().toISOString(),
      isRead: doc.isRead ?? false,
      status: doc.status ?? 'sent',
    };
  }

  private toEvaluation(doc: any): Evaluation {
    return {
      id: doc.id,
      spaceId: doc.spaceId,
      evaluatorId: doc.evaluatorId,
      evaluateeId: doc.evaluateeId,
      type: doc.type,
      punctuality: doc.punctuality,
      attitude: doc.attitude,
      technical: doc.technical,
      communication: doc.communication,
      overall: doc.overall,
      comments: doc.comments,
      date: doc.date,
      createdAt: doc.createdAt,
    };
  }

  private toLeaveRequest(doc: any): LeaveRequest {
    const fallbackDate = doc.createdAt instanceof Date
      ? doc.createdAt.toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0];
    return {
      id: doc.id,
      spaceId: doc.spaceId,
      userId: doc.userId,
      date: doc.date ?? doc.startDate ?? doc.endDate ?? fallbackDate,
      reason: doc.reason,
      status: doc.status,
      createdAt: doc.createdAt,
    } as any;
  }

  private toAnnouncement(doc: any): Announcement {
    const fallbackDate = doc.createdAt instanceof Date
      ? doc.createdAt.toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0];
    return {
      id: doc.id,
      spaceId: doc.spaceId,
      authorId: doc.authorId,
      title: doc.title,
      content: doc.content,
      date: doc.date ?? fallbackDate,
    };
  }

  async getUserStats(): Promise<{ total: number; byRole: Record<string, number>; newThisWeek: number }> {
    const users = await this.db.collection('users').find({}).toArray();

    const byRole: Record<string, number> = {
      student: 0,
      supervisor: 0,
      school: 0,
      admin: 0,
    };

    for (const u of users) {
      const role = u.role as string;
      if (byRole[role] === undefined) byRole[role] = 0;
      byRole[role] = (byRole[role] ?? 0) + 1;
    }

    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    let newThisWeek = 0;
    for (const u of users) {
      const createdAt = u.createdAt ? new Date(u.createdAt).getTime() : 0;
      if (createdAt >= weekAgo) newThisWeek++;
    }

    return {
      total: users.length,
      byRole,
      newThisWeek,
    };
  }

  async getSpaceStats(): Promise<{ total: number; byType: Record<string, number> }> {
    const spaces = await this.db.collection('spaces').find({}).toArray();
    const byType: Record<string, number> = { official: 0, private: 0 };
    for (const s of spaces) {
      const t = s.type as string;
      if (byType[t] === undefined) byType[t] = 0;
      byType[t] = (byType[t] ?? 0) + 1;
    }
    return { total: spaces.length, byType };
  }

  async getUsersWithStats(): Promise<Array<any>> {
    const users = await this.db.collection('users').find({}).toArray();
    const members = await this.db.collection('spaceMembers').find({}).toArray();

    const countByUserId = new Map<number, number>();
    for (const m of members) {
      countByUserId.set(m.userId, (countByUserId.get(m.userId) ?? 0) + 1);
    }

    return users.map((u) => ({
      ...this.toUser(u),
      spacesCount: countByUserId.get(u.id) ?? 0,
      lastLogin: null,
    }));
  }

  async getSpacesWithStats(): Promise<Array<any>> {
    const spaces = await this.db.collection('spaces').find({}).toArray();
    const members = await this.db.collection('spaceMembers').find({}).toArray();

    const countBySpaceId = new Map<number, number>();
    for (const m of members) {
      countBySpaceId.set(m.spaceId, (countBySpaceId.get(m.spaceId) ?? 0) + 1);
    }

    return spaces.map((s) => {
      const owner = s.ownerId ? undefined : undefined;
      return {
        ...this.toSpace(s),
        memberCount: countBySpaceId.get(s.id) ?? 0,
        ownerName: null,
      };
    });
  }

  // ─── Notifications ───────────────────────────────────────────────────────────
  async createNotification(data: { userId: number; spaceId: number; section: string; referenceId: number; type: string }): Promise<void> {
    try {
      const id = await this.getNextId('notification');
      await this.db.collection('notifications').insertOne({
        id,
        userId: data.userId,
        spaceId: data.spaceId,
        section: data.section,
        referenceId: data.referenceId,
        type: data.type,
        isRead: false,
        createdAt: new Date(),
      });
    } catch (err) {
      console.error('Failed to create notification:', err);
    }
  }

  async getNotificationCounts(spaceId: number, userId: number): Promise<Record<string, number>> {
    try {
      const notifs = await this.db.collection('notifications').find({ spaceId, userId, isRead: false }).toArray();
      const counts: Record<string, number> = { evaluations: 0, documents: 0, attendance: 0 };
      for (const n of notifs) {
        if (n.section in counts) counts[n.section]++;
      }
      return counts;
    } catch (err) {
      console.error('Failed to get notification counts:', err);
      return { evaluations: 0, documents: 0, attendance: 0 };
    }
  }

  async markNotificationsRead(spaceId: number, userId: number, section: string): Promise<void> {
    try {
      await this.db.collection('notifications').updateMany(
        { spaceId, userId, section, isRead: false },
        { $set: { isRead: true } }
      );
    } catch (err) {
      console.error('Failed to mark notifications read:', err);
    }
  }

  // System Logs
  async logSystemEvent(type: string, userId: number | null, details: Record<string, any>): Promise<void> {
    try {
      const logEntry = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        type,
        userId,
        details,
      };
      await this.db.collection('systemLogs').insertOne(logEntry);
    } catch (err) {
      console.error('Failed to log system event:', err);
      // Don't throw - logging shouldn't break the application
    }
  }
}

