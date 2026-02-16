import { Injectable, signal, computed } from '@angular/core';

export type GeolocationPermission = 'idle' | 'granted' | 'denied' | 'unavailable';

export interface UserLocation {
  latitude: number;
  longitude: number;
}

@Injectable({ providedIn: 'root' })
export class GeolocationService {
  readonly permission = signal<GeolocationPermission>('idle');
  readonly location = signal<UserLocation | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly hasLocation = computed(() => this.location() !== null);

  requestLocation(): void {
    if (!('geolocation' in navigator)) {
      this.permission.set('unavailable');
      this.error.set('Geolokacija nije dostupna u vašem pregledaču');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.location.set({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        this.permission.set('granted');
        this.loading.set(false);
      },
      (err) => {
        this.loading.set(false);
        if (err.code === err.PERMISSION_DENIED) {
          this.permission.set('denied');
          this.error.set('Pristup lokaciji je odbijen. Omogućite lokaciju u podešavanjima pregledača.');
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          this.permission.set('unavailable');
          this.error.set('Lokacija nije dostupna');
        } else {
          this.error.set('Greška pri dobijanju lokacije');
        }
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 300000, // Cache for 5 minutes
      },
    );
  }

  clearLocation(): void {
    this.location.set(null);
    this.error.set(null);
  }
}
