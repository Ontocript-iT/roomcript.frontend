import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssignRoom } from './assign-room';

describe('AssignRoom', () => {
  let component: AssignRoom;
  let fixture: ComponentFixture<AssignRoom>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssignRoom]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AssignRoom);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
