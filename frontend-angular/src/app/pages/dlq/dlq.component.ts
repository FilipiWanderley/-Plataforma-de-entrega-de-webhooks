import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ClipboardModule } from '@angular/cdk/clipboard';
import { SelectionModel } from '@angular/cdk/collections';
import { RouterModule } from '@angular/router';
import { DeliveryJob } from '../../models';

@Component({
  selector: 'app-dlq',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatCheckboxModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    ClipboardModule,
    RouterModule
  ],
  templateUrl: './dlq.component.html',
  styleUrl: './dlq.component.css'
})
export class DlqComponent implements OnInit {
  displayedColumns: string[] = ['select', 'id', 'endpointName', 'attemptCount', 'createdAt', 'actions'];
  dataSource = new MatTableDataSource<DeliveryJob>([]);
  selection = new SelectionModel<DeliveryJob>(true, []);
  filterForm: FormGroup;
  loading = false;
  totalElements = 0;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private http: HttpClient,
    private fb: FormBuilder,
    private snackBar: MatSnackBar
  ) {
    this.filterForm = this.fb.group({
      endpointId: [''],
      dateFrom: [''],
      dateTo: ['']
    });
  }

  ngOnInit() {
    this.loadJobs();
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
    this.paginator.page.subscribe(() => this.loadJobs());
  }

  loadJobs() {
    this.loading = true;
    const page = this.paginator ? this.paginator.pageIndex : 0;
    const size = this.paginator ? this.paginator.pageSize : 20;
    const filters = this.filterForm.value;

    let url = `http://localhost:8080/dlq?page=${page}&size=${size}`;
    if (filters.endpointId) url += `&endpointId=${filters.endpointId}`;
    // Add other filters as query params if backend supports them

    this.http.get<any>(url).subscribe({
      next: (response) => {
        this.dataSource.data = response.content;
        this.totalElements = response.totalElements;
        this.loading = false;
        this.selection.clear();
      },
      error: (err) => {
        console.error('Failed to load DLQ jobs', err);
        this.loading = false;
        this.snackBar.open('Failed to load DLQ jobs', 'Close', { duration: 3000 });
      }
    });
  }

  applyFilter() {
    if (this.paginator) {
      this.paginator.firstPage();
    }
    this.loadJobs();
  }

  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  toggleAllRows() {
    if (this.isAllSelected()) {
      this.selection.clear();
      return;
    }

    this.selection.select(...this.dataSource.data);
  }

  replaySelected() {
    if (this.selection.isEmpty()) return;

    if (!confirm(`Replay ${this.selection.selected.length} jobs?`)) return;

    const ids = this.selection.selected.map(job => job.id);
    // Assuming backend supports bulk replay or loop
    // For now, simple loop
    let successCount = 0;
    let failCount = 0;

    ids.forEach(id => {
      this.http.post(`http://localhost:8080/dlq/${id}/replay`, {}).subscribe({
        next: () => {
          successCount++;
          if (successCount + failCount === ids.length) this.finishBulkAction(successCount, failCount);
        },
        error: () => {
          failCount++;
          if (successCount + failCount === ids.length) this.finishBulkAction(successCount, failCount);
        }
      });
    });
  }

  finishBulkAction(success: number, fail: number) {
    this.snackBar.open(`Replayed: ${success}, Failed: ${fail}`, 'Close', { duration: 3000 });
    this.loadJobs();
  }

  onCopied() {
    this.snackBar.open('ID copied to clipboard', 'Close', { duration: 2000 });
  }
}
