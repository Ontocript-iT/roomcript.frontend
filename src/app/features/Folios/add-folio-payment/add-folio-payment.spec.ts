import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddFolioPayment } from './add-folio-payment';

describe('AddFolioPayment', () => {
  let component: AddFolioPayment;
  let fixture: ComponentFixture<AddFolioPayment>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddFolioPayment]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddFolioPayment);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
