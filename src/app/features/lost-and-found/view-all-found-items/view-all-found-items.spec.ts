import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewAllFoundItems } from './view-all-found-items';

describe('ViewAllFoundItems', () => {
  let component: ViewAllFoundItems;
  let fixture: ComponentFixture<ViewAllFoundItems>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViewAllFoundItems]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ViewAllFoundItems);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
