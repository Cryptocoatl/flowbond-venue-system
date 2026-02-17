'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { useTranslation } from '@/lib/i18n';

interface Task {
  id: string;
  type: string;
  name: string;
  description: string;
  order: number;
  isRequired: boolean;
  isCompleted?: boolean;
  completedAt?: string;
}

interface Quest {
  id: string;
  name: string;
  description: string;
  sponsor: {
    id: string;
    name: string;
    logo: string;
    primaryColor: string;
  };
  reward: {
    name: string;
    description: string;
  };
  tasks: Task[];
}

interface QuestProgress {
  status: string;
  tasks: Task[];
  completedCount: number;
  totalRequired: number;
}

export default function QuestPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { t } = useTranslation();
  
  const questId = searchParams.get('id');
  
  const [quest, setQuest] = useState<Quest | null>(null);
  const [progress, setProgress] = useState<QuestProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!questId) {
      router.push('/');
      return;
    }
    loadQuestData();
  }, [questId]);

  const loadQuestData = async () => {
    try {
      setLoading(true);
      const [questData, progressData] = await Promise.all([
        api.get<Quest>(`/tasks/quest/${questId}`),
        isAuthenticated ? api.get<Progress>(`/tasks/quest/${questId}/progress`) : Promise.resolve(null),
      ]);

      setQuest(questData);
      if (progressData) {
        setProgress(progressData);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load quest');
    } finally {
      setLoading(false);
    }
  };

  const completeTask = async (task: Task, data: any) => {
    if (!isAuthenticated) {
      router.push('/auth?redirect=' + encodeURIComponent(`/quest?id=${questId}`));
      return;
    }

    try {
      setCompleting(task.id);
      const result = await api.post<{ questCompleted: boolean }>(`/tasks/${task.id}/complete`, data);

      if (result.questCompleted) {
        router.push(`/redeem?questId=${questId}`);
      } else {
        await loadQuestData();
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to complete task');
    } finally {
      setCompleting(null);
    }
  };

  const renderTaskAction = (task: Task) => {
    const isCompleted = progress?.tasks.find(t => t.id === task.id)?.isCompleted;
    
    if (isCompleted) {
      return (
        <div className="flex items-center gap-2 text-green-600">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          <span>{t('tasks.completed')}</span>
        </div>
      );
    }

    switch (task.type) {
      case 'QR_SCAN':
        return (
          <button
            onClick={() => router.push(`/scan?taskId=${task.id}&questId=${questId}`)}
            disabled={completing === task.id}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {t('tasks.scan_qr')}
          </button>
        );
      
      case 'SURVEY':
        return (
          <button
            onClick={() => {/* Open survey modal */}}
            disabled={completing === task.id}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {t('tasks.take_survey')}
          </button>
        );
      
      case 'CHECKIN':
        return (
          <button
            onClick={async () => {
              if ('geolocation' in navigator) {
                navigator.geolocation.getCurrentPosition(
                  (pos) => completeTask(task, {
                    latitude: pos.coords.latitude,
                    longitude: pos.coords.longitude,
                  }),
                  () => setError('Location access denied')
                );
              }
            }}
            disabled={completing === task.id}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {completing === task.id ? t('common.loading') : t('tasks.check_in')}
          </button>
        );
      
      case 'SOCIAL_SHARE':
        return (
          <button
            onClick={() => {/* Open share modal */}}
            disabled={completing === task.id}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {t('tasks.share')}
          </button>
        );
      
      default:
        return (
          <button
            onClick={() => completeTask(task, {})}
            disabled={completing === task.id}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {t('tasks.complete')}
          </button>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!quest) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-gray-900 mb-2">{t('errors.quest_not_found')}</h1>
          <button onClick={() => router.push('/')} className="text-indigo-600 hover:underline">
            {t('common.go_home')}
          </button>
        </div>
      </div>
    );
  }

  const completedCount = progress?.completedCount || 0;
  const totalRequired = progress?.totalRequired || quest.tasks.filter(t => t.isRequired).length;
  const progressPercent = totalRequired > 0 ? (completedCount / totalRequired) * 100 : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div 
        className="bg-gradient-to-br from-indigo-600 to-pink-500 text-white p-6"
        style={{ 
          background: quest.sponsor.primaryColor 
            ? `linear-gradient(135deg, ${quest.sponsor.primaryColor} 0%, #ec4899 100%)`
            : undefined 
        }}
      >
        <button onClick={() => router.back()} className="mb-4 flex items-center gap-2 opacity-80 hover:opacity-100">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {t('common.back')}
        </button>
        
        <div className="flex items-center gap-4 mb-4">
          {quest.sponsor.logo && (
            <img src={quest.sponsor.logo} alt={quest.sponsor.name} className="w-12 h-12 rounded-lg bg-white p-1" />
          )}
          <div>
            <p className="text-sm opacity-80">{quest.sponsor.name}</p>
            <h1 className="text-2xl font-bold">{quest.name}</h1>
          </div>
        </div>
        
        <p className="text-sm opacity-90 mb-4">{quest.description}</p>
        
        {/* Progress Bar */}
        <div className="bg-white/20 rounded-full h-3 overflow-hidden">
          <div 
            className="bg-white h-full rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <p className="text-sm mt-2 opacity-80">
          {completedCount} / {totalRequired} {t('quests.tasks_completed')}
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mx-4 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
          <button onClick={() => setError('')} className="ml-2 underline">Dismiss</button>
        </div>
      )}

      {/* Reward Preview */}
      <div className="mx-4 mt-4 p-4 bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-yellow-800" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </div>
          <div>
            <p className="text-sm text-yellow-700 font-medium">{t('rewards.reward')}</p>
            <p className="font-semibold text-yellow-900">{quest.reward.name}</p>
          </div>
        </div>
      </div>

      {/* Tasks List */}
      <div className="p-4 space-y-3">
        <h2 className="font-semibold text-gray-900">{t('quests.tasks')}</h2>
        
        {quest.tasks
          .sort((a, b) => a.order - b.order)
          .map((task) => {
            const taskProgress = progress?.tasks.find(t => t.id === task.id);
            const isCompleted = taskProgress?.isCompleted;
            
            return (
              <div 
                key={task.id}
                className={`p-4 bg-white rounded-xl border-2 transition-all ${
                  isCompleted ? 'border-green-200 bg-green-50' : 'border-gray-100'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 text-sm flex items-center justify-center font-medium">
                        {task.order}
                      </span>
                      <h3 className="font-medium text-gray-900">{task.name}</h3>
                      {task.isRequired && (
                        <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full">
                          {t('tasks.required')}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 ml-8">{task.description}</p>
                  </div>
                  
                  <div className="flex-shrink-0">
                    {renderTaskAction(task)}
                  </div>
                </div>
              </div>
            );
          })}
      </div>

      {/* Complete Quest CTA */}
      {progress?.status === 'COMPLETED' && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t shadow-lg">
          <button
            onClick={() => router.push(`/redeem?questId=${questId}`)}
            className="w-full py-4 bg-gradient-to-r from-indigo-600 to-pink-500 text-white font-semibold rounded-xl hover:opacity-90"
          >
            {t('rewards.claim_reward')} 🎉
          </button>
        </div>
      )}
    </div>
  );
}
