import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { IvoryCarouselComponent } from './ivory-carousel.component';
import { IvorySlideDirective } from './directives/ivory-sldie.directive';

@NgModule({
  declarations: [
    IvoryCarouselComponent,
    IvorySlideDirective
  ],
  imports: [
    CommonModule
  ],
  exports: [
    IvoryCarouselComponent,
    IvorySlideDirective
  ]
})
export class IvoryCarouselModule { }
