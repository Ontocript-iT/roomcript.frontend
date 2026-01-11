import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpdateRoom } from './update-room';

describe('UpdateRoom', () => {
  let component: UpdateRoom;
  let fixture: ComponentFixture<UpdateRoom>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UpdateRoom]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UpdateRoom);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
