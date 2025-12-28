import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MoveRoom } from './move-room';

describe('MoveRoom', () => {
  let component: MoveRoom;
  let fixture: ComponentFixture<MoveRoom>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MoveRoom]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MoveRoom);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
