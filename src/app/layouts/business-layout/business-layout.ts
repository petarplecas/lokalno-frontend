import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-business-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './business-layout.html',
  styleUrl: './business-layout.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BusinessLayout {}
