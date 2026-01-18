import { Injectable, BadRequestException } from '@nestjs/common';
import { TaskType, Task } from '@prisma/client';
import { QRService } from '../qr/qr.service';

export interface TaskValidationResult {
  isValid: boolean;
  message?: string;
  data?: Record<string, unknown>;
}

export interface TaskValidationData {
  qrCode?: string;
  surveyResponses?: Record<string, unknown>;
  locationData?: {
    latitude: number;
    longitude: number;
  };
  socialProof?: {
    platform: string;
    postUrl?: string;
  };
  customData?: Record<string, unknown>;
}

interface TaskWithConfig extends Task {
  validationConfig: ValidationConfig | null;
}

interface ValidationConfig {
  expectedQRCode?: string;
  requiredFields?: string[];
  targetLocation?: {
    latitude: number;
    longitude: number;
    radiusMeters: number;
  };
  platforms?: string[];
  customValidator?: string;
}

@Injectable()
export class TaskValidationService {
  constructor(private qrService: QRService) {}

  async validate(
    task: TaskWithConfig,
    data: TaskValidationData,
  ): Promise<TaskValidationResult> {
    switch (task.type) {
      case TaskType.QR_SCAN:
        return this.validateQRScan(task, data);
      case TaskType.SURVEY:
        return this.validateSurvey(task, data);
      case TaskType.CHECKIN:
        return this.validateCheckin(task, data);
      case TaskType.SOCIAL_SHARE:
        return this.validateSocialShare(task, data);
      case TaskType.CUSTOM:
        return this.validateCustom(task, data);
      default:
        throw new BadRequestException(`Unknown task type: ${task.type}`);
    }
  }

  private async validateQRScan(
    task: TaskWithConfig,
    data: TaskValidationData,
  ): Promise<TaskValidationResult> {
    if (!data.qrCode) {
      return { isValid: false, message: 'QR code is required' };
    }

    try {
      const qrContext = await this.qrService.resolveQRCode(data.qrCode);
      const config = task.validationConfig as ValidationConfig | null;

      // If specific QR code is expected, verify it matches
      if (config?.expectedQRCode && qrContext.qrPoint.code !== config.expectedQRCode) {
        return { isValid: false, message: 'Wrong QR code scanned' };
      }

      return {
        isValid: true,
        data: {
          scannedCode: qrContext.qrPoint.code,
          venue: qrContext.venue.name,
          zone: qrContext.zone.name,
        },
      };
    } catch {
      return { isValid: false, message: 'Invalid QR code' };
    }
  }

  private validateSurvey(
    task: TaskWithConfig,
    data: TaskValidationData,
  ): Promise<TaskValidationResult> {
    if (!data.surveyResponses) {
      return Promise.resolve({ isValid: false, message: 'Survey responses are required' });
    }

    const config = task.validationConfig as ValidationConfig | null;
    const requiredFields = config?.requiredFields || [];

    for (const field of requiredFields) {
      if (!(field in data.surveyResponses)) {
        return Promise.resolve({
          isValid: false,
          message: `Missing required field: ${field}`,
        });
      }
    }

    return Promise.resolve({
      isValid: true,
      data: { responses: data.surveyResponses },
    });
  }

  private validateCheckin(
    task: TaskWithConfig,
    data: TaskValidationData,
  ): Promise<TaskValidationResult> {
    if (!data.locationData) {
      return Promise.resolve({ isValid: false, message: 'Location data is required' });
    }

    const config = task.validationConfig as ValidationConfig | null;
    const targetLocation = config?.targetLocation;

    if (targetLocation) {
      const distance = this.calculateDistance(
        data.locationData.latitude,
        data.locationData.longitude,
        targetLocation.latitude,
        targetLocation.longitude,
      );

      if (distance > targetLocation.radiusMeters) {
        return Promise.resolve({
          isValid: false,
          message: `Too far from target location (${Math.round(distance)}m away)`,
        });
      }
    }

    return Promise.resolve({
      isValid: true,
      data: { location: data.locationData },
    });
  }

  private validateSocialShare(
    task: TaskWithConfig,
    data: TaskValidationData,
  ): Promise<TaskValidationResult> {
    if (!data.socialProof) {
      return Promise.resolve({ isValid: false, message: 'Social proof is required' });
    }

    const config = task.validationConfig as ValidationConfig | null;
    const allowedPlatforms = config?.platforms || ['instagram', 'twitter', 'facebook', 'tiktok'];

    if (!allowedPlatforms.includes(data.socialProof.platform.toLowerCase())) {
      return Promise.resolve({
        isValid: false,
        message: `Platform ${data.socialProof.platform} is not accepted`,
      });
    }

    // In a real implementation, we might verify the post URL or use platform APIs
    return Promise.resolve({
      isValid: true,
      data: { socialProof: data.socialProof },
    });
  }

  private validateCustom(
    task: TaskWithConfig,
    data: TaskValidationData,
  ): Promise<TaskValidationResult> {
    // Custom validation can be extended based on validationConfig
    // For now, we just accept any data
    return Promise.resolve({
      isValid: true,
      data: { custom: data.customData },
    });
  }

  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }
}
