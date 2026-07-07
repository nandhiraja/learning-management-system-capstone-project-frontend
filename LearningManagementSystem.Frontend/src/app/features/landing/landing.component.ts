import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { PublicService, LandingStats, TopInstructor } from '../../core/services/public.service';
import { CourseService } from '../../core/services/course.service';
import { Course, Category } from '../../models/course.model';
import { CourseCardComponent } from '../courses/course-explore/course-card/course-card.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [RouterLink, CourseCardComponent, CommonModule],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.css'
})
export class LandingComponent implements OnInit {
  auth = inject(AuthService);
  router = inject(Router);
  private publicService = inject(PublicService);
  private courseService = inject(CourseService);

  stats = signal<LandingStats | null>(null);
  topCourses = signal<Course[]>([]);
  topInstructors = signal<TopInstructor[]>([]);
  categories = signal<Category[]>([]);

  ngOnInit() {
    this.publicService.getLandingStats().subscribe(res => this.stats.set(res));
    this.publicService.getTopInstructors(4).subscribe(res => this.topInstructors.set(res));
    this.courseService.getCategories().subscribe(res => this.categories.set(res.slice(0, 8))); // Top 8 categories
    
    this.courseService.getCourses({ page: 1, pageSize: 4, sortBy: 'rating' }).subscribe(res => {
      this.topCourses.set(res.items);
    });
  }

  onSearch(event: Event, searchVal: string) {
    event.preventDefault();
    if (searchVal.trim()) {
      this.router.navigate(['/courses'], { queryParams: { q: searchVal.trim() } });
    } else {
      this.router.navigate(['/courses']);
    }
  }

  getCategoryIcon(name: string): string {
    const n = name.toLowerCase();
    if (n.includes('develop') || n.includes('code') || n.includes('program') || n.includes('tech')) return 'bi-code-slash';
    if (n.includes('design') || n.includes('art') || n.includes('creative') || n.includes('ui') || n.includes('ux')) return 'bi-palette';
    if (n.includes('business') || n.includes('management') || n.includes('startup')) return 'bi-briefcase';
    if (n.includes('marketing') || n.includes('seo') || n.includes('ad')) return 'bi-megaphone';
    if (n.includes('photo') || n.includes('video') || n.includes('film')) return 'bi-camera';
    if (n.includes('music') || n.includes('song') || n.includes('audio')) return 'bi-music-note-beamed';
    if (n.includes('finance') || n.includes('crypt') || n.includes('money') || n.includes('invest')) return 'bi-cash-coin';
    if (n.includes('health') || n.includes('fitness') || n.includes('sport') || n.includes('gym')) return 'bi-heart-pulse';
    if (n.includes('office') || n.includes('excel') || n.includes('word') || n.includes('productivity')) return 'bi-file-earmark-spreadsheet';
    if (n.includes('personal') || n.includes('life') || n.includes('mind') || n.includes('growth')) return 'bi-person-up';
    return 'bi-folder2-open';
  }
}
