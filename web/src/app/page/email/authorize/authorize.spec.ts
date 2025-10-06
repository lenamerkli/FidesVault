import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Authorize } from './authorize';

describe('Authorize', () => {
  let component: Authorize;
  let fixture: ComponentFixture<Authorize>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Authorize]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Authorize);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
