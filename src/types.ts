export enum PitchType {
  FASTBALL = 'Fastball',
  CURVEBALL = 'Curveball',
  SLIDER = 'Slider',
  CHANGEUP = 'Changeup',
  SINKER = 'Sinker',
  SPLITTER = 'Splitter',
  OTHER = 'Other'
}

export enum PitchOutcome {
  STRIKE = 'Strike',
  BALL = 'Ball',
  IN_PLAY = 'In Play'
}

export interface Pitch {
  id: string;
  timestamp: number;
  type: PitchType;
  outcome: PitchOutcome;
  velocity?: number;
  notes?: string;
  location?: { x: number; y: number }; // x, y as percentages (0-100)
}

export interface Pitcher {
  id: string;
  name: string;
  profilePicture?: string; // base64 string
}

export interface BullpenSession {
  id: string;
  date: number;
  pitcherId?: string; // Optional for backward compatibility
  pitcherName: string;
  pitches: Pitch[];
  isCompleted: boolean;
  notes?: string;
}
