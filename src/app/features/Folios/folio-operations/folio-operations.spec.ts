import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FolioOperations } from './folio-operations';

describe('FolioOperations', () => {
  let component: FolioOperations;
  let fixture: ComponentFixture<FolioOperations>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FolioOperations]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FolioOperations);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
