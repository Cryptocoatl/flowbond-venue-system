import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { TaskValidationService, TaskValidationData } from './task-validation.service';
import { QuestStatus, TaskType } from '@prisma/client';

@Injectable()
export class TasksService {
  constructor(
    private prisma: PrismaService,
    private taskValidation: TaskValidationService,
  ) {}

  async getTask(taskId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: {
        quest: {
          include: {
            sponsor: true,
            drinkReward: true,
          },
        },
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return task;
  }

  async getQuestTasks(questId: string) {
    return this.prisma.task.findMany({
      where: { questId },
      orderBy: { order: 'asc' },
    });
  }

  async completeTask(taskId: string, userId: string, data: TaskValidationData) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: {
        quest: true,
      },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // Check if user has an active quest progress
    const progress = await this.prisma.questProgress.findUnique({
      where: {
        questId_userId: {
          questId: task.questId,
          userId,
        },
      },
    });

    if (!progress) {
      throw new BadRequestException('Quest not started. Please activate the quest first.');
    }

    if (progress.status === QuestStatus.COMPLETED) {
      throw new ConflictException('Quest already completed');
    }

    // Check if task already completed
    const existingCompletion = await this.prisma.taskCompletion.findUnique({
      where: {
        taskId_userId: {
          taskId,
          userId,
        },
      },
    });

    if (existingCompletion) {
      throw new ConflictException('Task already completed');
    }

    // Validate the task
    const validationResult = await this.taskValidation.validate(task, data);

    if (!validationResult.isValid) {
      throw new BadRequestException(validationResult.message || 'Task validation failed');
    }

    // Record completion
    const completion = await this.prisma.taskCompletion.create({
      data: {
        taskId,
        userId,
        data: validationResult.data,
      },
    });

    // Check if all tasks are completed
    const allTasks = await this.prisma.task.findMany({
      where: { questId: task.questId },
    });

    const completedTasks = await this.prisma.taskCompletion.findMany({
      where: {
        userId,
        taskId: { in: allTasks.map((t) => t.id) },
      },
    });

    const requiredTasks = allTasks.filter((t) => t.isRequired);
    const completedRequired = requiredTasks.filter((t) =>
      completedTasks.some((c) => c.taskId === t.id),
    );

    const questCompleted = completedRequired.length === requiredTasks.length;

    if (questCompleted) {
      // Update quest status
      await this.prisma.questProgress.update({
        where: { id: progress.id },
        data: {
          status: QuestStatus.COMPLETED,
          completedAt: new Date(),
        },
      });

      // Increment quest completion count
      await this.prisma.sponsorQuest.update({
        where: { id: task.questId },
        data: { completionCount: { increment: 1 } },
      });
    }

    return {
      completion,
      questCompleted,
      tasksRemaining: requiredTasks.length - completedRequired.length,
    };
  }

  async getUserTaskCompletions(userId: string, questId: string) {
    const tasks = await this.prisma.task.findMany({
      where: { questId },
      orderBy: { order: 'asc' },
    });

    const completions = await this.prisma.taskCompletion.findMany({
      where: {
        userId,
        taskId: { in: tasks.map((t) => t.id) },
      },
    });

    return tasks.map((task) => ({
      ...task,
      completed: completions.some((c) => c.taskId === task.id),
      completedAt: completions.find((c) => c.taskId === task.id)?.completedAt,
    }));
  }

  async createTask(data: {
    questId: string;
    name: string;
    description?: string;
    type: TaskType;
    validationConfig?: Record<string, unknown>;
    order?: number;
    isRequired?: boolean;
  }) {
    return this.prisma.task.create({
      data: {
        questId: data.questId,
        name: data.name,
        description: data.description,
        type: data.type,
        validationConfig: data.validationConfig,
        order: data.order || 0,
        isRequired: data.isRequired ?? true,
      },
    });
  }
}
