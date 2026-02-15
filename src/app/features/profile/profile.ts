import {
  Component,
  ChangeDetectionStrategy,
  inject,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { Role } from '../../core/models';

@Component({
  selector: 'app-profile',
  imports: [RouterLink],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Profile {
  private readonly authService = inject(AuthService);

  readonly user = this.authService.user;
  readonly Role = Role;

  readonly menuItems = [
    { label: 'Izmeni profil', icon: '✏️', route: '/profile/edit' },
    { label: 'Promeni lozinku', icon: '🔒', route: '/profile/password' },
    { label: 'Omiljeni biznisi', icon: '❤️', route: '/profile/favorites' },
    { label: 'Sačuvani popusti', icon: '🔖', route: '/profile/saved' },
  ];

  logout(): void {
    this.authService.logout();
  }
}
