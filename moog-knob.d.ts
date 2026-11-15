export type MoogKnobVariant = 'large' | 'pointer' | 'skirtless';
export type MoogKnobCap = 'silver' | 'brass' | 'black';
export type MoogKnobSize = 'sm' | 'md' | 'lg' | 'xl' | number;
export type MoogKnobDragMode = 'vertical' | 'circular';
export type MoogKnobShowValue = 'always' | 'hover' | 'never';

export interface MoogKnobEventDetail {
  value: number;
  normalized: number;
  formatted: string;
}

export class MoogKnob extends HTMLElement {
  value: number;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  bipolar: boolean;
  disabled: boolean;
  variant: MoogKnobVariant;
  cap: MoogKnobCap;
  format: ((value: number) => string) | null;
  readonly normalized: number;
  readonly formattedValue: string;
  reset(): void;
}

export function registerMoogKnob(tagName?: string): void;

declare global {
  interface HTMLElementTagNameMap {
    'moog-knob': MoogKnob;
  }
}
