import { Component, inject, signal, effect, viewChild, ElementRef, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { CategoriesService } from '../../api/api/categories.service';
import { ZidiumWebServiceFrontCategoryDto } from '../../api/model/zidiumWebServiceFrontCategoryDto';
import { CategoryModalComponent } from '../../shared/components/category-modal/category-modal.component';
import { ConfirmModalComponent } from '../../shared/components/confirm-modal/confirm-modal.component';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [FormsModule, CategoryModalComponent, ConfirmModalComponent],
  templateUrl: './categories.component.html',
  styleUrl: './categories.component.scss',
})
export class CategoriesComponent implements OnInit, OnDestroy {
  private readonly categoriesService = inject(CategoriesService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroy$ = new Subject<void>();

  readonly scrollContainer = viewChild<ElementRef>('scrollContainer');

  items = signal<ZidiumWebServiceFrontCategoryDto[]>([]);
  canEdit = signal(false);
  searchText = signal('');
  sortDesc = signal(false);
  isLoading = signal(false);
  hasMore = signal(true);
  pageNumber = signal(0);
  pageSize = 20;

  showAddModal = signal(false);
  showEditModal = signal(false);
  showDeleteModal = signal(false);
  selectedItem = signal<ZidiumWebServiceFrontCategoryDto | null>(null);
  deleteError = signal<string | null>(null);

  private searchSubject = new Subject<string>();

  constructor() {
    effect(() => {
      const id = this.route.snapshot.params['id'];
      if (id && !this.showAddModal() && !this.showEditModal()) {
        this.loadItem(+id);
      }
    });
  }

  ngOnInit(): void {
    this.searchSubject
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => {
        this.resetAndLoad();
      });

    this.resetAndLoad();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSearch(value: string): void {
    this.searchText.set(value);
    this.searchSubject.next(value);
  }

  onSort(): void {
    this.sortDesc.update((v) => !v);
    this.resetAndLoad();
  }

  onScroll(): void {
    if (this.isLoading() || !this.hasMore()) return;
    const container = this.scrollContainer()?.nativeElement;
    if (!container) return;
    const threshold = 50;
    if (container.scrollTop + container.clientHeight >= container.scrollHeight - threshold) {
      this.loadMore();
    }
  }

  openAddModal(): void {
    this.selectedItem.set(null);
    this.showAddModal.set(true);
  }

  openEditModal(item: ZidiumWebServiceFrontCategoryDto): void {
    this.selectedItem.set(item);
    this.showEditModal.set(true);
  }

  openDeleteModal(item: ZidiumWebServiceFrontCategoryDto): void {
    this.deleteError.set(null);
    this.selectedItem.set(item);
    this.showDeleteModal.set(true);
  }

  closeModals(): void {
    this.showAddModal.set(false);
    this.showEditModal.set(false);
    this.showDeleteModal.set(false);
    this.selectedItem.set(null);
    this.deleteError.set(null);
    this.router.navigate(['/categories']);
  }

  onSaved(): void {
    this.closeModals();
    this.resetAndLoad();
  }

  onDeleteConfirmed(): void {
    const id = this.selectedItem()?.id;
    if (!id) return;
    this.categoriesService._delete(id).subscribe({
      next: () => {
        this.closeModals();
        this.resetAndLoad();
      },
      error: (err) => {
        this.deleteError.set(err?.error?.message || 'Failed to delete');
      },
    });
  }

  trackById(index: number, item: ZidiumWebServiceFrontCategoryDto): number {
    return item.id;
  }

  private resetAndLoad(): void {
    this.items.set([]);
    this.pageNumber.set(0);
    this.hasMore.set(true);
    this.loadPage(0);
  }

  private loadMore(): void {
    if (!this.hasMore()) return;
    const nextPage = this.pageNumber() + 1;
    this.pageNumber.set(nextPage);
    this.loadPage(nextPage);
  }

  private loadPage(page: number): void {
    this.isLoading.set(true);
    this.categoriesService
      .getAll(this.searchText() || undefined, this.pageSize, page, this.sortDesc())
      .subscribe({
        next: (response) => {
          this.items.update((current) => [...current, ...response.items]);
          this.canEdit.set(response.canEdit);
          this.hasMore.set(response.items.length >= this.pageSize);
          this.isLoading.set(false);
        },
        error: () => {
          this.isLoading.set(false);
        },
      });
  }

  private loadItem(id: number): void {
    this.categoriesService.getById(id).subscribe({
      next: (item) => {
        this.selectedItem.set(item);
        this.showEditModal.set(true);
      },
      error: () => {
        this.router.navigate(['/categories']);
      },
    });
  }
}
