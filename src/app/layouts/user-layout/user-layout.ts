import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs';
import { Header } from '../../shared/components/header/header';
import { BottomNav } from '../../shared/components/bottom-nav/bottom-nav';

@Component({
  selector: 'app-user-layout',
  imports: [RouterOutlet, Header, BottomNav],
  templateUrl: './user-layout.html',
  styleUrl: './user-layout.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserLayout {
  private readonly router = inject(Router);

  readonly showHeader = toSignal(
    this.router.events.pipe(
      filter((e) => e instanceof NavigationEnd),
      map((e) => (e as NavigationEnd).urlAfterRedirects),
      startWith(this.router.url),
      map((url) => url === '/home' || url.startsWith('/home?')),
    ),
    { initialValue: true },
  );
}
