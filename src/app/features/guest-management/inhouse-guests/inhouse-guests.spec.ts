import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InhouseGuests } from './inhouse-guests';

describe('InhouseGuests', () => {
  let component: InhouseGuests;
  let fixture: ComponentFixture<InhouseGuests>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InhouseGuests]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InhouseGuests);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
