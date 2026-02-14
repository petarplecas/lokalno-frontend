import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from '../../shared/components/header/header';
import { BottomNav } from '../../shared/components/bottom-nav/bottom-nav';

@Component({
  selector: 'app-user-layout',
  imports: [RouterOutlet, Header, BottomNav],
  templateUrl: './user-layout.html',
  styleUrl: './user-layout.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserLayout {}
