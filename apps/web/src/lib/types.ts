// Domain Types

export type TaskType = 'QR_SCAN' | 'SURVEY' | 'CHECKIN' | 'SOCIAL_SHARE' | 'CUSTOM';
export type QuestStatus = 'IN_PROGRESS' | 'COMPLETED' | 'EXPIRED';
export type DrinkPassStatus = 'ACTIVE' | 'REDEEMED' | 'EXPIRED' | 'CANCELLED';
export type Language = 'en' | 'es' | 'fr';

export interface User {
  id: string;
  email: string | null;
  phone: string | null;
  language: Language;
  isGuest: boolean;
  isStaff: boolean;
  isAdmin: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Venue {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  address: string | null;
  timezone: string;
  logoUrl: string | null;
  isActive: boolean;
  zones?: Zone[];
  sponsors?: Sponsor[];
  createdAt: string;
  updatedAt: string;
}

export interface Zone {
  id: string;
  name: string;
  venueId: string;
  venue?: Venue;
  qrPoints?: QRPoint[];
  createdAt: string;
  updatedAt: string;
}

export interface QRPoint {
  id: string;
  code: string;
  name: string | null;
  description: string | null;
  zoneId: string;
  zone?: Zone;
  sponsorId: string | null;
  sponsor?: Sponsor;
  scanCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Sponsor {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  websiteUrl: string | null;
  isActive: boolean;
  quests?: SponsorQuest[];
  venues?: Venue[];
  createdAt: string;
  updatedAt: string;
}

export interface SponsorQuest {
  id: string;
  name: string;
  description: string | null;
  sponsorId: string;
  sponsor?: Sponsor;
  startDate: string;
  endDate: string;
  maxCompletions: number | null;
  completionCount: number;
  isActive: boolean;
  tasks?: Task[];
  drinkReward?: DrinkReward;
  venues?: Venue[];
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  name: string;
  description: string | null;
  type: TaskType;
  questId: string;
  quest?: SponsorQuest;
  validationConfig: Record<string, any>;
  order: number;
  isRequired: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TaskCompletion {
  id: string;
  taskId: string;
  task?: Task;
  userId: string;
  user?: User;
  data: Record<string, any>;
  completedAt: string;
  createdAt: string;
}

export interface QuestProgress {
  id: string;
  questId: string;
  quest?: SponsorQuest;
  userId: string;
  user?: User;
  status: QuestStatus;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DrinkReward {
  id: string;
  name: string;
  description: string | null;
  questId: string;
  quest?: SponsorQuest;
  sponsorId: string;
  sponsor?: Sponsor;
  validityHours: number;
  maxRedemptions: number | null;
  redemptionCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DrinkPass {
  id: string;
  code: string;
  rewardId: string;
  reward?: DrinkReward;
  userId: string;
  user?: User;
  venueId: string;
  venue?: Venue;
  status: DrinkPassStatus;
  expiresAt: string;
  redeemedAt: string | null;
  redeemedById: string | null;
  redeemedBy?: User;
  createdAt: string;
  updatedAt: string;
}

// API Response Types

export interface QRResolveResponse {
  qrPoint: QRPoint;
  zone: Zone;
  venue: Venue;
  sponsor: Sponsor | null;
  availableQuests: SponsorQuest[];
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface TaskCompletionResponse {
  completion: TaskCompletion;
  questProgress: QuestProgress;
  questCompleted: boolean;
}

export interface ClaimRewardResponse {
  drinkPass: DrinkPass;
}

export interface VerifyPassResponse {
  isValid: boolean;
  reason?: string;
  drinkPass?: DrinkPass;
}

export interface QuestProgressWithTasks extends QuestProgress {
  completedTasks: string[]; // Task IDs
  totalTasks: number;
  requiredTasks: number;
  completedRequiredTasks: number;
}

// UI Types

export interface LanguageOption {
  code: Language;
  name: string;
  nativeName: string;
}

export interface NavigationItem {
  label: string;
  href: string;
  icon?: string;
}

// Utility Types

export interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
