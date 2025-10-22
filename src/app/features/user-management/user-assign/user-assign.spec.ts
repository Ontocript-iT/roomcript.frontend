import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserAssign } from './user-assign';

describe('UserAssign', () => {
  let component: UserAssign;
  let fixture: ComponentFixture<UserAssign>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserAssign]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserAssign);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
