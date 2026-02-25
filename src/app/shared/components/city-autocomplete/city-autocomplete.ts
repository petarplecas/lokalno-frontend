import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  AfterViewInit,
  OnDestroy,
  ElementRef,
  viewChild,
  inject,
  NgZone,
} from '@angular/core';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-city-autocomplete',
  templateUrl: './city-autocomplete.html',
  styleUrl: './city-autocomplete.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CityAutocomplete implements AfterViewInit, OnDestroy {
  private readonly zone = inject(NgZone);

  readonly initialValue = input<string>('');
  readonly citySelected = output<string>();

  readonly geocoderContainer = viewChild<ElementRef>('geocoderContainer');

  private geocoder!: MapboxGeocoder;

  ngAfterViewInit(): void {
    this.zone.runOutsideAngular(() => {
      this.initGeocoder();
    });
  }

  ngOnDestroy(): void {
    // Geocoder doesn't have an explicit destroy method, container cleanup happens automatically
  }

  private initGeocoder(): void {
    const container = this.geocoderContainer()?.nativeElement as HTMLElement;
    if (!container) return;

    this.geocoder = new MapboxGeocoder({
      accessToken: environment.mapboxToken,
      placeholder: this.initialValue() || 'Pretražite grad...',
      countries: 'rs,ba,hr,me',
      types: 'place',
      language: 'sr',
    });

    this.geocoder.addTo(container);

    this.geocoder.on('result', (e: { result: { text: string } }) => {
      const city = e.result.text;
      this.zone.run(() => {
        this.citySelected.emit(city);
      });
    });

    this.geocoder.on('clear', () => {
      this.zone.run(() => {
        this.citySelected.emit('');
      });
    });
  }
}
