import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GuestMain } from './guest-main';

describe('GuestMain', () => {
  let component: GuestMain;
  let fixture: ComponentFixture<GuestMain>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GuestMain]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GuestMain);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
