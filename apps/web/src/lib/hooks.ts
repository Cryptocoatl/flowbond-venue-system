'use client';

import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import api from './api';
import type {
  Venue,
  Sponsor,
  SponsorQuest,
  Task,
  DrinkPass,
  QRResolveResponse,
  TaskCompletionResponse,
  ClaimRewardResponse,
  VerifyPassResponse,
  QuestProgressWithTasks,
} from './types';

// Query Keys
export const queryKeys = {
  user: ['user'] as const,
  venues: ['venues'] as const,
  venue: (id: string) => ['venue', id] as const,
  venueBySlug: (slug: string) => ['venue', 'slug', slug] as const,
  venueQuests: (venueId: string) => ['venue', venueId, 'quests'] as const,
  qr: (code: string) => ['qr', code] as const,
  sponsors: ['sponsors'] as const,
  sponsor: (id: string) => ['sponsor', id] as const,
  sponsorQuests: (sponsorId: string) => ['sponsor', sponsorId, 'quests'] as const,
  task: (id: string) => ['task', id] as const,
  questTasks: (questId: string) => ['quest', questId, 'tasks'] as const,
  questProgress: (questId: string) => ['quest', questId, 'progress'] as const,
  passes: ['passes'] as const,
  pass: (id: string) => ['pass', id] as const,
  verifyPass: (code: string) => ['pass', 'verify', code] as const,
};

// User Hooks
export function useUser() {
  return useQuery({
    queryKey: queryKeys.user,
    queryFn: () => api.getMe(),
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Venue Hooks
export function useVenues() {
  return useQuery({
    queryKey: queryKeys.venues,
    queryFn: () => api.getVenues(),
    staleTime: 10 * 60 * 1000,
  });
}

export function useVenue(id: string) {
  return useQuery({
    queryKey: queryKeys.venue(id),
    queryFn: () => api.getVenue(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useVenueBySlug(slug: string) {
  return useQuery({
    queryKey: queryKeys.venueBySlug(slug),
    queryFn: () => api.getVenueBySlug(slug),
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
  });
}

export function useVenueQuests(venueId: string) {
  return useQuery({
    queryKey: queryKeys.venueQuests(venueId),
    queryFn: () => api.getVenueQuests(venueId),
    enabled: !!venueId,
    staleTime: 2 * 60 * 1000,
  });
}

// QR Hooks
export function useQRResolve(code: string, options?: { enabled?: boolean }) {
  return useQuery<QRResolveResponse>({
    queryKey: queryKeys.qr(code),
    queryFn: () => api.resolveQR(code),
    enabled: options?.enabled !== false && !!code,
    staleTime: 30 * 1000, // 30 seconds
    retry: 1,
  });
}

// Sponsor Hooks
export function useSponsors() {
  return useQuery({
    queryKey: queryKeys.sponsors,
    queryFn: () => api.getSponsors(),
    staleTime: 10 * 60 * 1000,
  });
}

export function useSponsor(id: string) {
  return useQuery({
    queryKey: queryKeys.sponsor(id),
    queryFn: () => api.getSponsor(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useSponsorQuests(sponsorId: string) {
  return useQuery({
    queryKey: queryKeys.sponsorQuests(sponsorId),
    queryFn: () => api.getSponsorQuests(sponsorId),
    enabled: !!sponsorId,
    staleTime: 2 * 60 * 1000,
  });
}

// Task Hooks
export function useTask(id: string) {
  return useQuery({
    queryKey: queryKeys.task(id),
    queryFn: () => api.getTask(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useQuestTasks(questId: string) {
  return useQuery<Task[]>({
    queryKey: queryKeys.questTasks(questId),
    queryFn: () => api.getQuestTasks(questId),
    enabled: !!questId,
    staleTime: 2 * 60 * 1000,
  });
}

export function useQuestProgress(questId: string) {
  return useQuery<QuestProgressWithTasks>({
    queryKey: queryKeys.questProgress(questId),
    queryFn: () => api.getQuestProgress(questId),
    enabled: !!questId,
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000, // Auto-refetch every 30s
  });
}

export function useCompleteTask() {
  const queryClient = useQueryClient();
  
  return useMutation<TaskCompletionResponse, Error, { taskId: string; validationData: Record<string, any> }>({
    mutationFn: ({ taskId, validationData }) => api.completeTask(taskId, validationData),
    onSuccess: (data, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['quest'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.task(variables.taskId) });
    },
  });
}

// Reward/Pass Hooks
export function usePasses() {
  return useQuery<DrinkPass[]>({
    queryKey: queryKeys.passes,
    queryFn: () => api.getMyPasses(),
    staleTime: 1 * 60 * 1000,
  });
}

export function usePass(id: string) {
  return useQuery<DrinkPass>({
    queryKey: queryKeys.pass(id),
    queryFn: () => api.getPass(id),
    enabled: !!id,
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000,
  });
}

export function useVerifyPass(code: string) {
  return useQuery<VerifyPassResponse>({
    queryKey: queryKeys.verifyPass(code),
    queryFn: () => api.verifyPass(code),
    enabled: !!code && code.length >= 8,
    staleTime: 10 * 1000,
    retry: 1,
  });
}

export function useClaimReward() {
  const queryClient = useQueryClient();
  
  return useMutation<ClaimRewardResponse, Error, { questId: string; venueId: string }>({
    mutationFn: ({ questId, venueId }) => api.claimReward(questId, venueId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.passes });
      queryClient.invalidateQueries({ queryKey: ['quest'] });
    },
  });
}

export function useRedeemPass() {
  const queryClient = useQueryClient();
  
  return useMutation<DrinkPass, Error, string>({
    mutationFn: (id) => api.redeemPass(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.passes });
      queryClient.invalidateQueries({ queryKey: queryKeys.pass(data.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.verifyPass(data.code) });
    },
  });
}

export function useCancelPass() {
  const queryClient = useQueryClient();
  
  return useMutation<DrinkPass, Error, string>({
    mutationFn: (id) => api.cancelPass(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.passes });
      queryClient.invalidateQueries({ queryKey: queryKeys.pass(data.id) });
    },
  });
}

// Language Hook
export function useUpdateLanguage() {
  const queryClient = useQueryClient();
  
  return useMutation<any, Error, string>({
    mutationFn: (language) => api.updateLanguage(language),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.user });
    },
  });
}
