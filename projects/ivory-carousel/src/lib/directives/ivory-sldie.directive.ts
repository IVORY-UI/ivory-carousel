import { Directive, ElementRef, Input, TemplateRef } from '@angular/core';

let nextId = 0;

@Directive({
  selector: 'ng-template[carouselSlide]'
})
export class IvorySlideDirective {

  @Input() id = `owl-slide-${nextId++}`;

  constructor(
    public tplRef: TemplateRef<any>,
    public el: ElementRef) { }

}
