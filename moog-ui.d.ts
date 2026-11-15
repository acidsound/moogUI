export * from './moog-knob';

export type MoogSwitchVariant = 'rocker' | 'toggle';
export type MoogSwitchColor = 'orange' | 'blue' | 'red' | 'ivory' | 'dark';

export interface MoogSwitchEventDetail {
  checked: boolean;
  value: string;
}

export class MoogSwitch extends HTMLElement {
  checked: boolean;
  readonly value: string;
  disabled: boolean;
  variant: MoogSwitchVariant;
  toggle(): void;
}

export function registerMoogSwitch(tagName?: string): void;

export type MoogLedVariant = 'jewel' | 'flat';
export type MoogLedColor = 'amber' | 'red' | 'green' | 'blue' | 'pink' | string;

export class MoogLed extends HTMLElement {
  on: boolean;
  intensity: number;
}

export function registerMoogLed(tagName?: string): void;

declare global {
  interface HTMLElementTagNameMap {
    'moog-switch': MoogSwitch;
    'moog-led': MoogLed;
  }
}
