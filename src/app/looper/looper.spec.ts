import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LooperComponent } from './looper';

describe('Looper', () => {
  let component: LooperComponent;
  let fixture: ComponentFixture<LooperComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LooperComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LooperComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
