import { Routes } from '@angular/router';

export const coursesRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./course-list/course-list.component').then((m) => m.CourseListComponent)
  },

];
