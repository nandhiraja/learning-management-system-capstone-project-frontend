import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, signal, computed, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserProfile } from '../../../../shared/models/user.model';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-users.component.html',
  styleUrl: './admin-users.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminUsersComponent {
  @Input({ required: true }) users: UserProfile[] = [];

  @Output() toggleStatus = new EventEmitter<{ userGuid: string; isActive: boolean }>();
  @Output() demoteInstructor = new EventEmitter<string>();

  // Filter signals
  protected searchTerm = signal<string>('');
  protected selectedRole = signal<string>('ALL');

  protected isRoleDropdownOpen = signal<boolean>(false);
  protected roleDisplayNames: Record<string, string> = {
    'ALL': 'All Roles',
    'Student': 'Students',
    'Instructor': 'Instructors',
    'Admin': 'Admins'
  };

  toggleRoleDropdown() {
    this.isRoleDropdownOpen.update(val => !val);
  }

  selectRole(role: string) {
    this.selectedRole.set(role);
    this.isRoleDropdownOpen.set(false);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.custom-dropdown-container')) {
      this.isRoleDropdownOpen.set(false);
    }
  }

  // Computed filtered users list
  protected filteredUsers = computed<UserProfile[]>(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const role = this.selectedRole();

    return this.users.filter(user => {
      const matchesSearch = 
        !term || 
        user.firstName.toLowerCase().includes(term) ||
        user.lastName.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term);

      const matchesRole = 
        role === 'ALL' || 
        user.role.toUpperCase() === role.toUpperCase();

      return matchesSearch && matchesRole;
    });
  });

  onSearchChange(val: string) {
    this.searchTerm.set(val);
  }

  onRoleChange(val: string) {
    this.selectedRole.set(val);
  }

  onToggleActive(userExternalId: string, currentStatus: boolean) {
    const actionText = currentStatus ? 'block' : 'unblock';
    if (confirm(`Are you sure you want to ${actionText} this user?`)) {
      this.toggleStatus.emit({ userGuid: userExternalId, isActive: !currentStatus });
    }
  }

  onDemote(userExternalId: string) {
    if (confirm('Are you sure you want to demote this instructor back to a standard Student?')) {
      this.demoteInstructor.emit(userExternalId);
    }
  }
}
