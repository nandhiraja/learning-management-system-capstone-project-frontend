import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../core/services/admin.service';
import { NotificationService } from '../../shared/services/notification.service';
import { 
  AdminDashboardResponse, 
  PendingQueueResponse, 
  AdminCategoryResponse, 
  AdminLanguageResponse 
} from '../../models/admin.model';
import { UserProfile } from '../../shared/models/user.model';
import { CourseResponse } from '../../models/course.model';

// Subcomponents imports
import { AdminStatsComponent } from './components/admin-stats/admin-stats.component';
import { AdminApprovalsComponent } from './components/admin-approvals/admin-approvals.component';
import { AdminUsersComponent } from './components/admin-users/admin-users.component';
import { AdminCoursesComponent } from './components/admin-courses/admin-courses.component';
import { AdminContentComponent } from './components/admin-content/admin-content.component';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    AdminStatsComponent,
    AdminApprovalsComponent,
    AdminUsersComponent,
    AdminCoursesComponent,
    AdminContentComponent
  ],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.css'
})
export class AdminDashboardComponent implements OnInit {
  private adminService = inject(AdminService);
  private notification = inject(NotificationService);

  // Layout Tab selection: overview, approvals, users, courses, content
  protected activeTab = signal<string>('overview');

  // Loading indicator states
  protected isStatsLoading = signal<boolean>(true);
  protected isDataLoading = signal<boolean>(false);
  protected processingId = signal<string | null>(null);

  // Dashboard Data Signals
  protected stats = signal<AdminDashboardResponse | null>(null);
  protected pendingQueue = signal<PendingQueueResponse>({ pendingCourses: [], pendingInstructors: [] });
  protected users = signal<UserProfile[]>([]);
  protected courses = signal<CourseResponse[]>([]);
  protected categories = signal<AdminCategoryResponse[]>([]);
  protected languages = signal<AdminLanguageResponse[]>([]);
  protected pendingContentCount = signal<number>(0);
  protected isRegeneratingCerts = signal<boolean>(false);

  ngOnInit() {
    this.loadStats();
    // Default load corresponding to tab
    this.loadTabData('overview');
    this.refreshPendingContentCount();
  }

  // --- Certificate Tools ---
  protected regenerateCertificates() {
    this.isRegeneratingCerts.set(true);
    this.adminService.regenerateAllCertificates().subscribe({
      next: (res) => {
        this.notification.success(res.message);
        this.isRegeneratingCerts.set(false);
      },
      error: () => {
        this.notification.error('Failed to regenerate certificates.');
        this.isRegeneratingCerts.set(false);
      }
    });
  }

  private refreshPendingContentCount() {
    this.adminService.getCategories().subscribe({
      next: (cats) => {
        const pendingCats = cats.filter(c => !c.isApproved).length;
        this.adminService.getLanguages().subscribe({
          next: (langs) => {
            const pendingLangs = langs.filter(l => !l.isApproved).length;
            this.pendingContentCount.set(pendingCats + pendingLangs);
          }
        });
      }
    });
  }

  protected setTab(tabName: string) {
    this.activeTab.set(tabName);
    this.loadTabData(tabName);
  }

  // Load dashboard overview counts
  private loadStats() {
    this.isStatsLoading.set(true);
    this.adminService.getDashboardStats().subscribe({
      next: (res) => {
        this.stats.set(res);
        this.isStatsLoading.set(false);
      },
      error: () => {
        this.notification.error('Failed to load dashboard metrics.');
        this.isStatsLoading.set(false);
      }
    });
  }

  // Load active tab data on click
  private loadTabData(tab: string) {
    this.isDataLoading.set(true);
    
    if (tab === 'overview') {
      this.loadStats();
      this.isDataLoading.set(false);
    } else if (tab === 'approvals') {
      this.adminService.getPendingQueue().subscribe({
        next: (res) => {
          this.pendingQueue.set(res);
          this.isDataLoading.set(false);
        },
        error: () => {
          this.notification.error('Failed to load pending queue items.');
          this.isDataLoading.set(false);
        }
      });
    } else if (tab === 'users') {
      this.adminService.getUsers().subscribe({
        next: (res) => {
          this.users.set(res);
          this.isDataLoading.set(false);
        },
        error: () => {
          this.notification.error('Failed to load users list.');
          this.isDataLoading.set(false);
        }
      });
    } else if (tab === 'courses') {
      this.adminService.getCourses().subscribe({
        next: (res) => {
          this.courses.set(res);
          this.isDataLoading.set(false);
        },
        error: () => {
          this.notification.error('Failed to load courses catalogue.');
          this.isDataLoading.set(false);
        }
      });
    } else if (tab === 'content') {
      this.adminService.getCategories().subscribe({
        next: (cats) => {
          this.categories.set(cats);
          this.adminService.getLanguages().subscribe({
            next: (langs) => {
              this.languages.set(langs);
              this.isDataLoading.set(false);
            },
            error: () => {
              this.notification.error('Failed to load instruction languages.');
              this.isDataLoading.set(false);
            }
          });
        },
        error: () => {
          this.notification.error('Failed to load course categories.');
          this.isDataLoading.set(false);
        }
      });
    }
  }

  // --- Course Review Approvals ---
  protected handleApproveCourse(courseId: string) {
    this.processingId.set(courseId);
    this.adminService.reviewCourse(courseId, 'Approved').subscribe({
      next: () => {
        this.notification.success('Course published successfully!');
        this.loadStats();
        this.adminService.getPendingQueue().subscribe({
          next: (res) => {
            this.pendingQueue.set(res);
            this.processingId.set(null);
          },
          error: () => this.processingId.set(null)
        });
      },
      error: () => {
        this.notification.error('Failed to publish course.');
        this.processingId.set(null);
      }
    });
  }

  protected handleRejectCourse(event: { courseId: string; reason: string }) {
    this.processingId.set(event.courseId);
    this.adminService.reviewCourse(event.courseId, 'Rejected', event.reason).subscribe({
      next: () => {
        this.notification.success('Course rejection processed.');
        this.loadStats();
        this.adminService.getPendingQueue().subscribe({
          next: (res) => {
            this.pendingQueue.set(res);
            this.processingId.set(null);
          },
          error: () => this.processingId.set(null)
        });
      },
      error: () => {
        this.notification.error('Failed to reject course review request.');
        this.processingId.set(null);
      }
    });
  }

  // --- Instructor Promotion Requests ---
  protected handleApproveInstructor(userGuid: string) {
    this.processingId.set(userGuid);
    this.adminService.updateUserRole(userGuid, 'ApproveInstructor').subscribe({
      next: () => {
        this.notification.success('Instructor request approved!');
        this.loadStats();
        this.adminService.getPendingQueue().subscribe({
          next: (res) => {
            this.pendingQueue.set(res);
            this.processingId.set(null);
          },
          error: () => this.processingId.set(null)
        });
      },
      error: () => {
        this.notification.error('Failed to approve instructor promotion.');
        this.processingId.set(null);
      }
    });
  }

  protected handleRejectInstructor(userGuid: string) {
    this.processingId.set(userGuid);
    this.adminService.updateUserRole(userGuid, 'RejectInstructor').subscribe({
      next: () => {
        this.notification.success('Instructor request rejected.');
        this.loadStats();
        this.adminService.getPendingQueue().subscribe({
          next: (res) => {
            this.pendingQueue.set(res);
            this.processingId.set(null);
          },
          error: () => this.processingId.set(null)
        });
      },
      error: () => {
        this.notification.error('Failed to reject instructor request.');
        this.processingId.set(null);
      }
    });
  }

  // --- User Bans & Demotions ---
  protected handleToggleUserStatus(event: { userGuid: string; isActive: boolean }) {
    this.adminService.updateUserStatus(event.userGuid, event.isActive).subscribe({
      next: () => {
        this.notification.success(event.isActive ? 'User account unblocked.' : 'User account blocked.');
        this.loadTabData('users');
        this.loadStats();
      },
      error: () => {
        this.notification.error('Failed to update user active status.');
      }
    });
  }

  protected handleDemoteInstructor(userGuid: string) {
    this.adminService.updateUserRole(userGuid, 'DemoteToStudent').subscribe({
      next: () => {
        this.notification.success('Instructor demoted to Student successfully.');
        this.loadTabData('users');
        this.loadStats();
      },
      error: () => {
        this.notification.error('Failed to demote instructor.');
      }
    });
  }

  // --- Category Approvals ---
  protected handleApproveCategory(id: number) {
    this.adminService.approveCategory(id).subscribe({
      next: () => {
        this.notification.success('Category approved!');
        this.loadTabData('content');
        this.refreshPendingContentCount();
      },
      error: () => {
        this.notification.error('Failed to approve category.');
      }
    });
  }

  protected handleDeleteCategory(id: number) {
    this.adminService.deleteCategory(id).subscribe({
      next: () => {
        this.notification.success('Category deleted.');
        this.loadTabData('content');
        this.refreshPendingContentCount();
      },
      error: () => {
        this.notification.error('Failed to delete category.');
      }
    });
  }

  // --- Language Approvals ---
  protected handleApproveLanguage(id: number) {
    this.adminService.approveLanguage(id).subscribe({
      next: () => {
        this.notification.success('Language approved!');
        this.loadTabData('content');
        this.refreshPendingContentCount();
      },
      error: () => {
        this.notification.error('Failed to approve language.');
      }
    });
  }

  protected handleDeleteLanguage(id: number) {
    this.adminService.deleteLanguage(id).subscribe({
      next: () => {
        this.notification.success('Language deleted.');
        this.loadTabData('content');
        this.refreshPendingContentCount();
      },
      error: () => {
        this.notification.error('Failed to delete language.');
      }
    });
  }

  // --- Category & Language direct creation ---
  protected handleCreateCategory(name: string) {
    this.adminService.createCategory(name).subscribe({
      next: () => {
        this.notification.success('Category created successfully!');
        this.loadTabData('content');
        this.refreshPendingContentCount();
      },
      error: (err) => {
        this.notification.error(err.error?.message || 'Failed to create category.');
      }
    });
  }

  protected handleCreateLanguage(name: string) {
    this.adminService.createLanguage(name).subscribe({
      next: () => {
        this.notification.success('Language created successfully!');
        this.loadTabData('content');
        this.refreshPendingContentCount();
      },
      error: (err) => {
        this.notification.error(err.error?.message || 'Failed to create language.');
      }
    });
  }
}
