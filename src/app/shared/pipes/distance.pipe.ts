import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'distance' })
export class DistancePipe implements PipeTransform {
  transform(meters: number | null | undefined): string {
    if (meters == null) return '';

    if (meters < 1000) {
      return `${Math.round(meters)} m`;
    }

    const km = meters / 1000;
    return `${km.toFixed(1)} km`;
  }
}
