import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CertificatePreview } from './certificate-preview';

describe('CertificatePreview', () => {
  let component: CertificatePreview;
  let fixture: ComponentFixture<CertificatePreview>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CertificatePreview],
    }).compileComponents();

    fixture = TestBed.createComponent(CertificatePreview);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
