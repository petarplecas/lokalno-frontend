import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';

export interface DiscountTemplateConfig {
  bgColor: string;
  accentColor: string;
  icon: string;
  label: string;
  pattern: 'dots' | 'waves' | 'diagonal' | 'grid';
}

export const DISCOUNT_TEMPLATES: Record<string, DiscountTemplateConfig> = {
  food:     { bgColor: '#FF8C42', accentColor: '#fff',    icon: '🍽️', label: 'Hrana & Piće',  pattern: 'dots' },
  fashion:  { bgColor: '#8e44ad', accentColor: '#fff',    icon: '👗', label: 'Moda',           pattern: 'diagonal' },
  beauty:   { bgColor: '#e91e8c', accentColor: '#fff',    icon: '💄', label: 'Lepota',         pattern: 'dots' },
  fitness:  { bgColor: '#20B2AA', accentColor: '#fff',    icon: '💪', label: 'Fitnes',         pattern: 'waves' },
  tech:     { bgColor: '#2c3e50', accentColor: '#20B2AA', icon: '💻', label: 'Tehnologija',    pattern: 'grid' },
  travel:   { bgColor: '#2980b9', accentColor: '#fff',    icon: '✈️', label: 'Putovanja',      pattern: 'waves' },
  health:   { bgColor: '#27ae60', accentColor: '#fff',    icon: '🏥', label: 'Zdravlje',       pattern: 'dots' },
  services: { bgColor: '#7f8c8d', accentColor: '#fff',    icon: '🔧', label: 'Usluge',         pattern: 'diagonal' },
};

export const DEFAULT_TEMPLATE = 'food';

@Component({
  selector: 'app-discount-template-visual',
  templateUrl: './discount-template-visual.html',
  styleUrl: './discount-template-visual.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiscountTemplateVisual {
  readonly templateId = input<string | null>(null);

  readonly config = computed<DiscountTemplateConfig>(() => {
    const id = this.templateId() ?? DEFAULT_TEMPLATE;
    return DISCOUNT_TEMPLATES[id] ?? DISCOUNT_TEMPLATES[DEFAULT_TEMPLATE];
  });
}
