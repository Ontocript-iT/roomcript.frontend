import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewAllTask } from './view-all-task';

describe('ViewAllTask', () => {
  let component: ViewAllTask;
  let fixture: ComponentFixture<ViewAllTask>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViewAllTask]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ViewAllTask);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
