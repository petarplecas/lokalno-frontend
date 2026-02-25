import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  OnInit,
} from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from '../../../core/services/user.service';
import { FavoriteBusinessItem } from '../../../core/models';
import { PageHeader } from '../../../shared/components/page-header/page-header';
import { Spinner } from '../../../shared/components/spinner/spinner';
import { EmptyState } from '../../../shared/components/empty-state/empty-state';

@Component({
  selector: 'app-favorites',
  imports: [PageHeader, Spinner, EmptyState],
  templateUrl: './favorites.html',
  styleUrl: './favorites.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Favorites implements OnInit {
  private readonly userService = inject(UserService);
  private readonly router = inject(Router);

  readonly favorites = signal<FavoriteBusinessItem[]>([]);
  readonly loading = signal(true);

  ngOnInit(): void {
    this.userService.getFavorites().subscribe({
      next: (res) => {
        this.favorites.set(res.data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  goToBusiness(id: string): void {
    void this.router.navigate(['/businesses', id]);
  }
}
