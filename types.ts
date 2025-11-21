export enum Tab {
  CHAT = 'CHAT',
  TASKS = 'TASKS',
  LIVE = 'LIVE'
}

export enum UserRole {
  ADMIN = 'Admin',
  MEMBER = 'Member',
  GUEST = 'Guest'
}

export interface User {
  id: string;
  name: string;
  email?: string;
  avatar: string;
  role: UserRole;
  isAi?: boolean;
}

export interface Attachment {
  name: string;
  type: string;
  data: string; // Base64
  mimeType: string;
}

export interface Message {
  id: string;
  userId: string;
  text: string;
  timestamp: Date;
  attachments?: Attachment[];
  isSystem?: boolean;
}

export enum TaskStatus {
  TODO = 'To Do',
  IN_PROGRESS = 'In Progress',
  DONE = 'Done'
}

export enum TaskPriority {
  HIGH = 'High',
  MEDIUM = 'Medium',
  LOW = 'Low'
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string; // ISO Date string YYYY-MM-DD
  assignee?: string;
}

export interface LiveSessionConfig {
  audioContext: AudioContext;
  inputNode: GainNode;
  outputNode: GainNode;
}