import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'timeAgo' })
export class TimeAgoPipe implements PipeTransform {
  transform(value: string | null): string {
    if (!value) return '';

    const date = new Date(value);
    const now = Date.now();
    const diffMs = now - date.getTime();

    if (diffMs < 0) return 'upravo';

    const minutes = Math.floor(diffMs / 60_000);
    const hours = Math.floor(diffMs / 3_600_000);
    const days = Math.floor(diffMs / 86_400_000);

    if (minutes < 1) return 'upravo';
    if (minutes < 60) return `pre ${minutes} min`;
    if (hours < 24) return `pre ${hours}h`;
    if (days === 1) return 'pre 1 dan';
    if (days < 30) return `pre ${days} dana`;

    const months = Math.floor(days / 30);
    if (months === 1) return 'pre 1 mesec';
    return `pre ${months} meseci`;
  }
}
