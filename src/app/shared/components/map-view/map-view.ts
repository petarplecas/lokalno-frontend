import {
  Component,
  ChangeDetectionStrategy,
  input,
  AfterViewInit,
  OnDestroy,
  ElementRef,
  viewChild,
  inject,
  NgZone,
} from '@angular/core';
import mapboxgl from 'mapbox-gl';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-map-view',
  templateUrl: './map-view.html',
  styleUrl: './map-view.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MapView implements AfterViewInit, OnDestroy {
  private readonly zone = inject(NgZone);

  readonly lat = input.required<number>();
  readonly lng = input.required<number>();
  readonly label = input<string>('');
  readonly interactive = input(false);

  readonly mapContainer = viewChild<ElementRef>('mapContainer');

  private map!: mapboxgl.Map;

  ngAfterViewInit(): void {
    this.zone.runOutsideAngular(() => {
      this.initMap();
    });
  }

  ngOnDestroy(): void {
    this.map?.remove();
  }

  navigateToGoogleMaps(): void {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${this.lat()},${this.lng()}`;
    window.open(url, '_blank', 'noopener');
  }

  private initMap(): void {
    (mapboxgl as unknown as { accessToken: string }).accessToken = environment.mapboxToken;

    const container = this.mapContainer()?.nativeElement as HTMLElement;
    if (!container) return;

    this.map = new mapboxgl.Map({
      container,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [this.lng(), this.lat()],
      zoom: 15,
      interactive: this.interactive(),
    });

    new mapboxgl.Marker({ color: '#20B2AA' })
      .setLngLat([this.lng(), this.lat()])
      .addTo(this.map);
  }
}
