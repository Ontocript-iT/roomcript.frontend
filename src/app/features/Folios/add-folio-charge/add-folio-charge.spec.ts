import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddFolioCharge } from './add-folio-charge';

describe('AddFolioCharge', () => {
  let component: AddFolioCharge;
  let fixture: ComponentFixture<AddFolioCharge>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddFolioCharge]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddFolioCharge);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
