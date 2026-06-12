import { z } from 'zod';
import {
  insertUserSchema, insertSpaceSchema, insertGroupSchema,
  insertTimeLogSchema, insertScrumSchema, insertTaskSchema,
  insertAttendanceSchema, insertDocumentSchema, insertMessageSchema,
  insertEvaluationSchema, insertLeaveRequestSchema, insertAnnouncementSchema,
  users, spaces, spaceMembers, groups, timeLogs, scrums, tasks, attendance, documents, messages,
  evaluations, leaveRequests, announcements
} from './schema';

export const errorSchemas = {
  validation: z.object({ message: z.string(), field: z.string().optional() }),
  notFound: z.object({ message: z.string() }),
  unauthorized: z.object({ message: z.string() }),
};

export const api = {
  auth: {
    login: {
      method: 'POST' as const,
      path: '/api/auth/login' as const,
      input: z.object({ username: z.string(), password: z.string() }),
      responses: {
        200: z.object({ user: z.custom<typeof users.$inferSelect>() }),
        401: errorSchemas.unauthorized,
      }
    },
    register: {
      method: 'POST' as const,
      path: '/api/auth/register' as const,
      input: insertUserSchema,
      responses: {
        201: z.object({ user: z.custom<typeof users.$inferSelect>() }),
        400: errorSchemas.validation,
      }
    },
    me: {
      method: 'GET' as const,
      path: '/api/auth/me' as const,
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: errorSchemas.unauthorized,
      }
    },
    logout: {
      method: 'POST' as const,
      path: '/api/auth/logout' as const,
      responses: {
        200: z.object({ success: z.boolean() })
      }
    }
  },
  spaces: {
    list: {
      method: 'GET' as const,
      path: '/api/spaces' as const,
      responses: { 200: z.array(z.custom<typeof spaces.$inferSelect>()) }
    },
    create: {
      method: 'POST' as const,
      path: '/api/spaces' as const,
      input: insertSpaceSchema,
      responses: { 201: z.custom<typeof spaces.$inferSelect>() }
    },
    join: {
      method: 'POST' as const,
      path: '/api/spaces/join' as const,
      input: z.object({ joinCode: z.string() }),
      responses: { 
        200: z.custom<typeof spaceMembers.$inferSelect>(),
        404: errorSchemas.notFound 
      }
    }
  },
  scrums: {
    list: {
      method: 'GET' as const,
      path: '/api/spaces/:spaceId/scrums' as const,
      input: z.object({ userId: z.string().optional(), date: z.string().optional() }).optional(),
      responses: { 200: z.array(z.custom<typeof scrums.$inferSelect>()) }
    },
    create: {
      method: 'POST' as const,
      path: '/api/spaces/:spaceId/scrums' as const,
      input: insertScrumSchema,
      responses: { 201: z.custom<typeof scrums.$inferSelect>() }
    },
    approve: {
      method: 'PATCH' as const,
      path: '/api/spaces/:spaceId/scrums/:id/approve' as const,
      responses: { 200: z.custom<typeof scrums.$inferSelect>() }
    }
  },
  tasks: {
    list: {
      method: 'GET' as const,
      path: '/api/spaces/:spaceId/tasks' as const,
      responses: { 200: z.array(z.custom<typeof tasks.$inferSelect>()) }
    },
    create: {
      method: 'POST' as const,
      path: '/api/spaces/:spaceId/tasks' as const,
      input: insertTaskSchema.extend({ 
        assignedToIds: z.array(z.number()).optional() 
      }),
      responses: { 201: z.custom<typeof tasks.$inferSelect>() }
    },
    update: {
      method: 'PUT' as const,
      path: '/api/spaces/:spaceId/tasks/:id' as const,
      input: insertTaskSchema.partial(),
      responses: { 200: z.custom<typeof tasks.$inferSelect>() }
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/spaces/:spaceId/tasks/:id' as const,
      responses: { 204: z.void() }
    }
  },
  timeLogs: {
    list: {
      method: 'GET' as const,
      path: '/api/spaces/:spaceId/time-logs' as const,
      responses: { 200: z.array(z.custom<typeof timeLogs.$inferSelect>()) }
    },
    create: {
      method: 'POST' as const,
      path: '/api/spaces/:spaceId/time-logs' as const,
      input: insertTimeLogSchema,
      responses: { 201: z.custom<typeof timeLogs.$inferSelect>() }
    },
    approve: {
      method: 'PATCH' as const,
      path: '/api/spaces/:spaceId/time-logs/:id/approve' as const,
      responses: { 200: z.custom<typeof timeLogs.$inferSelect>() }
    }
  },
  attendance: {
    list: {
      method: 'GET' as const,
      path: '/api/spaces/:spaceId/attendance' as const,
      responses: { 200: z.array(z.custom<typeof attendance.$inferSelect>()) }
    },
    create: {
      method: 'POST' as const,
      path: '/api/spaces/:spaceId/attendance' as const,
      input: insertAttendanceSchema,
      responses: { 201: z.custom<typeof attendance.$inferSelect>() }
    }
  },
  documents: {
    list: {
      method: 'GET' as const,
      path: '/api/spaces/:spaceId/documents' as const,
      responses: { 200: z.array(z.custom<typeof documents.$inferSelect>()) }
    },
    create: {
      method: 'POST' as const,
      path: '/api/spaces/:spaceId/documents' as const,
      input: insertDocumentSchema,
      responses: { 201: z.custom<typeof documents.$inferSelect>() }
    }
  },
  messages: {
    list: {
      method: 'GET' as const,
      path: '/api/spaces/:spaceId/messages' as const,
      input: z.object({ channelId: z.string() }).optional(),
      responses: { 200: z.array(z.custom<typeof messages.$inferSelect>()) }
    },
    create: {
      method: 'POST' as const,
      path: '/api/spaces/:spaceId/messages' as const,
      input: insertMessageSchema,
      responses: { 201: z.custom<typeof messages.$inferSelect>() }
    }
  },
  groups: {
    list: {
      method: 'GET' as const,
      path: '/api/spaces/:spaceId/groups' as const,
      responses: { 200: z.array(z.custom<typeof groups.$inferSelect>()) }
    },
    create: {
      method: 'POST' as const,
      path: '/api/spaces/:spaceId/groups' as const,
      input: insertGroupSchema,
      responses: { 201: z.custom<typeof groups.$inferSelect>() }
    }
  },
  evaluations: {
    list: {
      method: 'GET' as const,
      path: '/api/spaces/:spaceId/evaluations' as const,
      responses: { 200: z.array(z.custom<typeof evaluations.$inferSelect>()) }
    },
    create: {
      method: 'POST' as const,
      path: '/api/spaces/:spaceId/evaluations' as const,
      input: insertEvaluationSchema,
      responses: { 201: z.custom<typeof evaluations.$inferSelect>() }
    }
  },
  leaveRequests: {
    list: {
      method: 'GET' as const,
      path: '/api/spaces/:spaceId/leave-requests' as const,
      responses: { 200: z.array(z.custom<typeof leaveRequests.$inferSelect>()) }
    },
    create: {
      method: 'POST' as const,
      path: '/api/spaces/:spaceId/leave-requests' as const,
      input: insertLeaveRequestSchema,
      responses: { 201: z.custom<typeof leaveRequests.$inferSelect>() }
    }
  },
  announcements: {
    list: {
      method: 'GET' as const,
      path: '/api/spaces/:spaceId/announcements' as const,
      responses: { 200: z.array(z.custom<typeof announcements.$inferSelect>()) }
    },
    create: {
      method: 'POST' as const,
      path: '/api/spaces/:spaceId/announcements' as const,
      input: insertAnnouncementSchema,
      responses: { 201: z.custom<typeof announcements.$inferSelect>() }
    }
  },
  admin: {
    overview: {
      method: 'GET' as const,
      path: '/api/admin/overview' as const,
      responses: {
        200: z.object({
          totalUsers: z.number(),
          totalSpaces: z.number(),
          totalStudents: z.number(),
          totalSupervisors: z.number(),
          totalSchoolCoords: z.number(),
          activeUsers: z.number(),
          newUsersThisWeek: z.number(),
        })
      }
    },
    users: {
      list: {
        method: 'GET' as const,
        path: '/api/admin/users' as const,
        input: z.object({ 
          role: z.enum(['student', 'supervisor', 'school', 'admin']).optional(),
          search: z.string().optional() 
        }).optional(),
        responses: { 200: z.array(z.custom<typeof users.$inferSelect>()) }
      },
      get: {
        method: 'GET' as const,
        path: '/api/admin/users/:id' as const,
        responses: { 
          200: z.object({
            user: z.custom<typeof users.$inferSelect>(),
            spacesCount: z.number(),
            joinedDate: z.string(),
            lastLogin: z.string().nullable()
          })
        }
      },
      updateRole: {
        method: 'PATCH' as const,
        path: '/api/admin/users/:id/role' as const,
        input: z.object({ role: z.enum(['student', 'supervisor', 'school', 'admin']) }),
        responses: { 200: z.custom<typeof users.$inferSelect>() }
      },
      disable: {
        method: 'PATCH' as const,
        path: '/api/admin/users/:id/disable' as const,
        responses: { 200: z.custom<typeof users.$inferSelect>() }
      }
    },
    spaces: {
      list: {
        method: 'GET' as const,
        path: '/api/admin/spaces' as const,
        input: z.object({ 
          type: z.enum(['official', 'private']).optional(),
          search: z.string().optional() 
        }).optional(),
        responses: { 
          200: z.array(z.object({
            space: z.custom<typeof spaces.$inferSelect>(),
            memberCount: z.number(),
            ownerName: z.string()
          }))
        }
      },
      get: {
        method: 'GET' as const,
        path: '/api/admin/spaces/:id' as const,
        responses: { 
          200: z.object({
            space: z.custom<typeof spaces.$inferSelect>(),
            members: z.array(z.object({
              id: z.number(),
              userId: z.number(),
              username: z.string(),
              role: z.string(),
              spaceRole: z.string()
            })),
            stats: z.object({
              totalMembers: z.number(),
              totalTasks: z.number(),
              totalDocuments: z.number()
            })
          })
        }
      }
    },
    analytics: {
      userGrowth: {
        method: 'GET' as const,
        path: '/api/admin/analytics/user-growth' as const,
        input: z.object({ period: z.enum(['week', 'month', 'year']).optional() }).optional(),
        responses: { 
          200: z.array(z.object({
            date: z.string(),
            count: z.number(),
            roleBreakdown: z.object({
              student: z.number(),
              supervisor: z.number(),
              school: z.number()
            })
          }))
        }
      },
      logs: {
        method: 'GET' as const,
        path: '/api/admin/analytics/logs' as const,
        input: z.object({
          type: z.enum(['login', 'logout', 'userupdate', 'spacecreate']).optional(),
          limit: z.number().optional()
        }).optional(),
        responses: {
          200: z.array(z.object({
            id: z.string(),
            timestamp: z.string(),
            type: z.string(),
            userId: z.number().nullable(),
            details: z.record(z.any())
          }))
        }
      }
    }
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
