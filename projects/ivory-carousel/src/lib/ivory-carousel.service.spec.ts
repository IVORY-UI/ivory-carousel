import { TestBed } from '@angular/core/testing';

import { IvoryCarouselService } from './ivory-carousel.service';

describe('IvoryCarouselService', () => {
  let service: IvoryCarouselService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(IvoryCarouselService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
