export enum Category {
  FULL_LOOK = 'Look Completo',
  PANTS = 'Calças',
  SHIRTS = 'Blusas',
  ACCESSORIES = 'Acessórios'
}

export enum AppStep {
  UPLOAD = 'UPLOAD',
  TRY_ON = 'TRY_ON',
  BACKGROUND = 'BACKGROUND',
  RESULT = 'RESULT'
}

export interface GeneratedImage {
  imageUrl: string;
  base64: string;
}

export interface ProcessingState {
  isProcessing: boolean;
  message: string;
}

export interface GarmentSelection {
  upper?: string | null;
  lower?: string | null;
  accessory?: string | null;
}