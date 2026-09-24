export type AccountType = 'personal' | 'professional';
export type TaskMode = 'personal' | 'professional';
export type Priority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'todo' | 'in_progress' | 'in_review' | 'done';
export type Recurrence = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
export type TeamRole = 'manager' | 'team_lead' | 'team_member';

export interface User {
  id: number;
  username: string;
  email?: string;
  first_name: string;
  last_name: string;
  account_type: AccountType;
  avatar_url?: string | null;
  email_notifications_enabled?: boolean;
  date_joined?: string;
}

export interface Category {
  id: number;
  name: string;
  color: string;
}

export interface Tag {
  id: number;
  name: string;
}

export interface Comment {
  id: number;
  task: number;
  author: User;
  body: string;
  created_at: string;
}

export interface Attachment {
  id: number;
  task: number;
  file: string;
  original_name: string;
  uploaded_by: User;
  uploaded_at: string;
}

export interface ActivityLogEntry {
  id: number;
  action: string;
  actor: User | null;
  created_at: string;
}

export interface Task {
  id: number;
  mode: TaskMode;
  title: string;
  description: string;
  priority: Priority;
  status: TaskStatus;
  tags: Tag[];
  due_date: string | null;
  reminder_at: string | null;
  recurrence_frequency: Recurrence;
  recurrence_end_date: string | null;
  owner: User | null;
  category: Category | null;
  team: number | null;
  board: number | null;
  assignee: User | null;
  created_by: User | null;
  watchers: User[];
  comments: Comment[];
  attachments: Attachment[];
  logs: ActivityLogEntry[];
  comment_count?: number;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export interface TeamMembership {
  id: number;
  user: User;
  role: TeamRole;
  joined_at: string;
}

export interface Team {
  id: number;
  name: string;
  description: string;
  created_by: number;
  memberships: TeamMembership[];
  my_role: TeamRole | null;
  created_at: string;
}

export interface ProjectBoard {
  id: number;
  team: number;
  name: string;
  description: string;
  created_by: number;
  created_at: string;
}

export interface AppNotification {
  id: number;
  event: string;
  message: string;
  is_read: boolean;
  created_at: string;
  object_id: number | null;
  related_type: string | null;
}

export interface DashboardStats {
  total: number;
  completed: number;
  overdue: number;
  upcoming_7_days: number;
  by_status: Record<string, number>;
  by_priority: Record<string, number>;
  calendar: { id: number; title: string; due_date: string; status: string; priority: string }[];
  by_assignee?: { assignee__username: string; count: number }[];
}

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
