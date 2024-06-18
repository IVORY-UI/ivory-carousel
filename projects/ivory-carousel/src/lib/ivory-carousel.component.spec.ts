import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IvoryCarouselComponent } from './ivory-carousel.component';

describe('IvoryCarouselComponent', () => {
  let component: IvoryCarouselComponent;
  let fixture: ComponentFixture<IvoryCarouselComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [IvoryCarouselComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(IvoryCarouselComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
