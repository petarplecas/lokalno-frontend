import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  AfterViewInit,
  OnDestroy,
  ElementRef,
  viewChild,
  signal,
  inject,
  NgZone,
} from '@angular/core';
import mapboxgl from 'mapbox-gl';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import { environment } from '../../../../environments/environment';

export interface SelectedLocation {
  address: string;
  latitude: number;
  longitude: number;
}

@Component({
  selector: 'app-map-picker',
  templateUrl: './map-picker.html',
  styleUrl: './map-picker.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MapPicker implements AfterViewInit, OnDestroy {
  private readonly zone = inject(NgZone);

  readonly initialLat = input<number>(44.8176);
  readonly initialLng = input<number>(20.4633);
  readonly initialAddress = input<string>('');

  readonly locationSelected = output<SelectedLocation>();

  readonly mapContainer = viewChild<ElementRef>('mapContainer');

  readonly selectedAddress = signal<string>('');

  private map!: mapboxgl.Map;
  private marker!: mapboxgl.Marker;

  ngAfterViewInit(): void {
    this.zone.runOutsideAngular(() => {
      this.initMap();
    });
  }

  ngOnDestroy(): void {
    this.map?.remove();
  }

  private initMap(): void {
    (mapboxgl as unknown as { accessToken: string }).accessToken = environment.mapboxToken;

    const container = this.mapContainer()?.nativeElement as HTMLElement;
    if (!container) return;

    const lat = this.initialLat();
    const lng = this.initialLng();

    this.map = new mapboxgl.Map({
      container,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [lng, lat],
      zoom: 14,
    });

    this.marker = new mapboxgl.Marker({ draggable: true, color: '#20B2AA' })
      .setLngLat([lng, lat])
      .addTo(this.map);

    this.marker.on('dragend', () => {
      const lngLat = this.marker.getLngLat();
      this.reverseGeocode(lngLat.lat, lngLat.lng);
    });

    const geocoder = new MapboxGeocoder({
      accessToken: environment.mapboxToken,
      mapboxgl: mapboxgl as unknown as MapboxGeocoder.GeocoderOptions['mapboxgl'],
      placeholder: 'Pretražite adresu...',
      countries: 'rs,ba,hr,me',
      language: 'sr',
      marker: false,
    });

    this.map.addControl(geocoder, 'top-left');

    geocoder.on('result', (e: { result: { geometry: { coordinates: [number, number] }; place_name: string } }) => {
      const [lng, lat] = e.result.geometry.coordinates;
      const address = e.result.place_name;

      this.marker.setLngLat([lng, lat]);
      this.map.flyTo({ center: [lng, lat], zoom: 15 });

      this.zone.run(() => {
        this.selectedAddress.set(address);
        this.locationSelected.emit({ address, latitude: lat, longitude: lng });
      });
    });

    this.map.addControl(new mapboxgl.NavigationControl(), 'bottom-right');

    if (this.initialAddress()) {
      this.zone.run(() => {
        this.selectedAddress.set(this.initialAddress());
      });
    }
  }

  private reverseGeocode(lat: number, lng: number): void {
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${environment.mapboxToken}&language=sr`;
    fetch(url)
      .then((r) => r.json())
      .then((data: { features?: Array<{ place_name: string }> }) => {
        const address = data.features?.[0]?.place_name ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
        this.zone.run(() => {
          this.selectedAddress.set(address);
          this.locationSelected.emit({ address, latitude: lat, longitude: lng });
        });
      });
  }
}
