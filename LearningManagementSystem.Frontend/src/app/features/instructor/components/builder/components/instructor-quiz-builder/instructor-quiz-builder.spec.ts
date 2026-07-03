import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InstructorQuizBuilder } from './instructor-quiz-builder';

describe('InstructorQuizBuilder', () => {
  let component: InstructorQuizBuilder;
  let fixture: ComponentFixture<InstructorQuizBuilder>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InstructorQuizBuilder],
    }).compileComponents();

    fixture = TestBed.createComponent(InstructorQuizBuilder);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
