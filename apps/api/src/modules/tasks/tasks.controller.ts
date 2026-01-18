import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { TasksService } from './tasks.service';
import { CompleteTaskDto } from './dto/tasks.dto';

@ApiTags('tasks')
@Controller('tasks')
export class TasksController {
  constructor(private tasksService: TasksService) {}

  @Get(':id')
  @ApiOperation({ summary: 'Get task details' })
  @ApiResponse({ status: 200, description: 'Task details' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  async getTask(@Param('id') id: string) {
    return this.tasksService.getTask(id);
  }

  @Post(':id/complete')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Complete a task' })
  @ApiResponse({ status: 200, description: 'Task completed' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 409, description: 'Task already completed' })
  async completeTask(
    @Param('id') id: string,
    @Request() req: { user: { id: string } },
    @Body() dto: CompleteTaskDto,
  ) {
    return this.tasksService.completeTask(id, req.user.id, dto);
  }

  @Get('quest/:questId')
  @ApiOperation({ summary: 'Get all tasks for a quest' })
  @ApiResponse({ status: 200, description: 'List of tasks' })
  async getQuestTasks(@Param('questId') questId: string) {
    return this.tasksService.getQuestTasks(questId);
  }

  @Get('quest/:questId/progress')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user progress on quest tasks' })
  @ApiResponse({ status: 200, description: 'Task progress' })
  async getQuestProgress(
    @Param('questId') questId: string,
    @Request() req: { user: { id: string } },
  ) {
    return this.tasksService.getUserTaskCompletions(req.user.id, questId);
  }
}
