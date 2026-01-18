import { Module } from '@nestjs/common';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { TaskValidationService } from './task-validation.service';
import { QRModule } from '../qr/qr.module';

@Module({
  imports: [QRModule],
  controllers: [TasksController],
  providers: [TasksService, TaskValidationService],
  exports: [TasksService],
})
export class TasksModule {}
