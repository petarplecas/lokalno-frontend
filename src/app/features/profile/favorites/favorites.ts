import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  OnInit,
} from '@angular/core';
import { UserService } from '../../../core/services/user.service';
import { FavoriteBusinessItem } from '../../../core/models';
import { BackButton } from '../../../shared/components/back-button/back-button';
import { Spinner } from '../../../shared/components/spinner/spinner';
import { EmptyState } from '../../../shared/components/empty-state/empty-state';

@Component({
  selector: 'app-favorites',
  imports: [BackButton, Spinner, EmptyState],
  templateUrl: './favorites.html',
  styleUrl: './favorites.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Favorites implements OnInit {
  private readonly userService = inject(UserService);

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
}
