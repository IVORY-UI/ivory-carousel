import {
  AfterContentInit,
  Component,
  ContentChildren,
  ElementRef,
  HostListener,
  Input,
  OnDestroy,
  OnInit,
  Renderer2,
  ViewChild,
  ViewChildren,
} from '@angular/core';
import { IvorySlideDirective } from './directives/ivory-sldie.directive';
import { DomSanitizer } from '@angular/platform-browser';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'ivory-carousel',
  templateUrl: './ivory-carousel.component.html',
  styles: ``
})
export class IvoryCarouselComponent implements OnInit, OnDestroy, AfterContentInit {
  
  prevTag: any;
  nextTag: any;
  dotsArray: any[] = [];
  selectedDot: any = 1;
  autoPlaySub: Subscription = new Subscription();
  autoPlayTimer: any;
  slidesChangeSubscription: Subscription = new Subscription();
  carouselWidth: any;
  clicksAllowed: number = 0;
  clicksMade: number = 0;
  slideByMultiplier: any;
  iconPos: any;
  slidesOnPage: any = 1;
  navSpeed: any;

  @Input() options: any;

  @Input() ariaDescribedby: any;

  @ContentChildren(IvorySlideDirective) slides: any;

  @ViewChildren('slideBox') slideBox: any;

  @ViewChild('outerSlide') outerSlide: any;

  @ViewChild('slideContainer') slideContainer: any;

  @ViewChild('liveregion') liveregion: any;

  constructor(private sanitizer: DomSanitizer, private renderer: Renderer2) {}

  /**
   * Update slides accomodation on resize event
   * @param event
   */
  @HostListener('window:resize', ['$event'])
  resize(event: any) {
    this.onResize();
  }

  ngOnInit(): void {
    this.generateNavigationTags();
  }

  ngAfterContentInit() {
    this.doSetup();
  }

  /**
   * Start setting up the slide accomoodation on render
   */
  doSetup() {
    setTimeout(() => {
      this.accomodateSlide();
      this.updateOndDataChange();
    }, 10);
  }

  /**
   * Update slide accomodation when slides data is changed
   */
  updateOndDataChange() {
    this.slidesChangeSubscription = this.slides.changes.subscribe((data: any) => {
      setTimeout(() => {
        this.accomodateSlide();
      }, 40);
    });
  }

  /**
   * Generate next and previous buttons based on the custom html recieved
   */
  generateNavigationTags() {
    if (this.options && this.options.navText && this.options.navText[0]) {
      this.prevTag = this.sanitizer.bypassSecurityTrustHtml(this.options.navText[0]);
    }

    if (this.options && this.options.navText && this.options.navText[1]) {
      this.nextTag = this.sanitizer.bypassSecurityTrustHtml(this.options.navText[1]);
    }
  }

  /**
   * Set carousel width based on slides required and width allotted to the slider div
   */
  accomodateSlide() {
    const width = this.outerSlide.nativeElement.offsetWidth;
    this.iconPos = this.options && this.options.iconPos;
    if (this.options && this.options.responsive) {
      let reqSlides = this.getRequiredSlides(width);
      let boxWidth: any;
      if (this.slideBox && this.slideBox.first && this.slideBox.first.nativeElement) {
        boxWidth = this.slideBox.first.nativeElement.offsetWidth
          ? this.slideBox.first.nativeElement.offsetWidth
          : this.slideBox.last.nativeElement.offsetWidth;
      }
      // else {
      //   boxWidth = 0;
      // }
      const totalBoxWidth = boxWidth * reqSlides;
      if (width > totalBoxWidth) {
        if (reqSlides === 1) {
          this.slideBox._results.forEach((item: any) => {
            this.renderer.setStyle(item['nativeElement'], 'width', width + 'px');
          });
          this.carouselWidth = width;
        } else {
          const setMargin = Math.round((width - totalBoxWidth) / (reqSlides - 1));
          this.slideBox._results.forEach((item: any) => {
            // this.renderer.setStyle(item['nativeElement'], 'margin-right', 11 + 'px');
            this.renderer.setStyle(item['nativeElement'], 'margin-right', setMargin + 'px');
            this.renderer.removeStyle(item['nativeElement'], 'width');
          });
          this.carouselWidth =
            totalBoxWidth + (reqSlides - 1) * Number(this.slideBox.first.nativeElement.style.marginRight.replace('px', ''));
        }
      } else if (width < totalBoxWidth) {
        const reduceWidth = (totalBoxWidth - width) / reqSlides;
        this.slideBox._results.forEach((item: any) => {
          this.renderer.setStyle(item['nativeElement'], 'width', boxWidth - reduceWidth + 'px');
        });
        this.carouselWidth = reqSlides * (boxWidth - reduceWidth);
      } else if (width === totalBoxWidth) {
        if (reqSlides !== 1) {
          this.slideBox._results.forEach((item: any) => {
            this.renderer.setStyle(item['nativeElement'], 'width', boxWidth + 'px');
            this.renderer.removeStyle(item['nativeElement'], 'margin-right');
          });
          this.carouselWidth = width;
        }
      }

      // here we need to check if required slide more than one we need to add role attribute
      if (reqSlides > 1) {
        this.renderer.setAttribute(this.slideContainer['nativeElement'],'role','listbox');
        if (this.ariaDescribedby) {
          this.renderer.setAttribute(this.slideContainer['nativeElement'],'aria-describedby',this.ariaDescribedby)
        }
        this.slideBox._results.forEach((item: any) => {
          this.renderer.setAttribute(item['nativeElement'], 'role','listitem');
        });
      } else {
        if (this.slideContainer?.nativeElement && this.slideContainer['nativeElement'].getAttribute('role') !== null) {
          this.renderer.removeAttribute(this.slideContainer['nativeElement'],'role')
          this.slideBox._results.forEach((item: any) => {
            this.renderer.removeAttribute(item['nativeElement'], 'role');
          });
        }
      }
      this.calculateClicksAllowed(reqSlides);
    } else {
      this.calculateClicksAllowed(1);
    }
    this.clicksMade = 0;
    this.selectedDot = 0;
    this.renderer.setStyle(this.slideContainer['nativeElement'], 'transform', 'translate3d(0px,0px,0px)');
    this.navSpeed = 'all ' + this.options.navSpeed / 1000 + 's ease 0s';
    this.autoPlayTimer = (this.options && this.options.autoplaySpeed) || 4000;
    this.startPlayML();

    this.bindTabIndexToAnchorTag(true);
  }

  /**
   * Get required number of slides based on width and number of items allotted to that width in options
   * @param outerSlidewidth
   * @returns reqSlides
   */
  getRequiredSlides(outerSlidewidth: any) {
    let reqSlides;
    let item;
    const resolutions = Object.keys(this.options && this.options.responsive);
    if (resolutions.findIndex((itemV) => Number(itemV) === outerSlidewidth) !== -1) {
      item = resolutions.findIndex((itemV) => Number(itemV) == outerSlidewidth);
      reqSlides = this.options.responsive[resolutions[item]].items;
    } else {
      item = resolutions.findIndex((itemV) => Number(itemV) > outerSlidewidth);
      if (item !== -1) {
        reqSlides = this.options.responsive[resolutions[item - 1]].items;
      } else {
        reqSlides = this.options.responsive[resolutions[resolutions.length - 1]].items;
      }
    }
    this.slidesOnPage = reqSlides;

    return reqSlides;
  }

  /**
   * Generate dots for dots navigation
   * @param dotsNumber
   */
  generateDots(dotsNumber: any) {
    this.dotsArray = [];
    for (let i = 0; i < dotsNumber; i++) {
      this.dotsArray.push(i);
    }
  }

  /**
   * Handle dots navigation on dot click event
   */
  dotClick(index: any, announce: boolean = false) {
    let multiplier;
    multiplier = this.options && this.options.slideBy ? this.options && this.options.slideBy : 1;
    let boxWidth: any;
    boxWidth = this.slideBox.first.nativeElement.offsetWidth
      ? this.slideBox.first.nativeElement.offsetWidth
      : this.slideBox.last.nativeElement.offsetWidth;
    const width = multiplier * (boxWidth + Number(this.slideBox.first.nativeElement.style.marginRight.replace('px', '')));
    let updateTransformX;
    if (index === 0) {
      updateTransformX = '0';
      this.clicksMade = 0;
    } else if (index === this.dotsArray.length - 1) {
      updateTransformX = '-' + ((this.dotsArray.length - 1) * Number(width)).toString();
      this.clicksMade = this.clicksAllowed;
    } else {
      updateTransformX = '-' + (index * Number(width)).toString();
      this.clicksMade = index;
    }
    this.renderer.setStyle(this.slideContainer['nativeElement'], 'transform', 'translate3d(' + updateTransformX + 'px,0px,0px)');
    this.selectedDot = index;
    this.setLiveRegion(announce);
  }

  onResize() {
    this.accomodateSlide();
  }

  /**
   * Handle on click event for previous button
   */
  prev(announce: boolean = false) {
    let multiplier;
    multiplier = this.options && this.options.slideBy ? this.options && this.options.slideBy : 1;
    let boxWidth: any;
    boxWidth = this.slideBox.first.nativeElement.offsetWidth
      ? this.slideBox.first.nativeElement.offsetWidth
      : this.slideBox.last.nativeElement.offsetWidth;
    if (boxWidth) {
      if (this.clicksMade > 0) {
        if (this.slideByMultiplier || this.slideByMultiplier === 0) {
          multiplier = this.slideByMultiplier + 1;
        }
        const width = multiplier * (boxWidth + Number(this.slideBox.first.nativeElement.style.marginRight.replace('px', '')));
        const transformStr = this.slideContainer['nativeElement'].style.transform;
        const updateTransformX = Number(transformStr.split('(').pop().split(',')[0].replace('px', '')) + Number(width);
        this.renderer.setStyle(this.slideContainer['nativeElement'], 'transform', 'translate3d(' + updateTransformX + 'px,0px,0px)');
        this.clicksMade--;
        this.slideByMultiplier = undefined;
        this.selectedDot = this.clicksMade;

        this.setLiveRegion(announce);
      }
    }
  }

  /**
   * Handle on click event for next button
   */
  next(announce: boolean = false) {
    let multiplier;
    multiplier = this.options && this.options.slideBy ? this.options && this.options.slideBy : 1;
    let boxWidth: any;
    boxWidth = this.slideBox.first.nativeElement.offsetWidth
      ? this.slideBox.first.nativeElement.offsetWidth
      : this.slideBox.last.nativeElement.offsetWidth;
    if (boxWidth) {
      this.updateSlideWidth(boxWidth);
      if (this.clicksMade < this.clicksAllowed) {
        multiplier = this.getSlideByMultiplier(multiplier);
        const width = multiplier * (boxWidth + Number(this.slideBox.first.nativeElement.style.marginRight.replace('px', '')));
        const transformStr = this.slideContainer['nativeElement'].style.transform;
        const updateTransformX = Number(transformStr.split('(').pop().split(',')[0].replace('px', '')) - Number(width);
        this.renderer.setStyle(this.slideContainer['nativeElement'], 'transform', 'translate3d(' + updateTransformX + 'px,0px,0px)');
        this.clicksMade++;
        this.selectedDot = this.clicksMade;
        this.setLiveRegion(announce);
      }
    }
  }

  /**
   * In case the slide image or card is not getting no width, readjust its width based on other slides.
   * @param boxWidth
   */
  updateSlideWidth(boxWidth: any) {
    this.slideBox._results.forEach((item: any) => {
      if (this.slidesOnPage === 1 && this.clicksMade === 0) {
        this.renderer.setStyle(item['nativeElement'], 'width', boxWidth + 'px');
      }
    });
  }

  /**
   * Get custom slide by multiplier when on the end of list and need to slide by with a value different than the actual slide by value from options
   * @param multiplier
   * @returns
   */
  getSlideByMultiplier(multiplier: any) {
    if (this.clicksMade + 1 === this.clicksAllowed) {
      if (this.options && this.options.slideBy && this.options.slideBy !== 1) {
        multiplier = this.slides.length - (this.slidesOnPage + this.clicksMade * this.options.slideBy);
        this.slideByMultiplier = multiplier - 1 ? multiplier - 1 : 0;
      }
    }
    return multiplier;
  }

  /**
   * Calculate click allowed
   * @param totalSlides
   */
  calculateClicksAllowed(totalSlides: any) {
    if (this.options && this.options.slideBy) {
      const click = Math.floor((this.slides.length - totalSlides) / this.options.slideBy);
      this.clicksAllowed = totalSlides % this.options.slideBy === 0 ? click : click + 1;
    } else {
      this.clicksAllowed = this.slides.length - totalSlides;
    }
    this.generateDots(this.clicksAllowed + 1);
  }

  /**
   * Pause autoplay/Unsubscribe autoplay subscription
   */
  startPausing() {
    if (this.autoPlaySub) {
      this.autoPlaySub.unsubscribe();
    }
  }

  /**
   * Start autoplay and invoke autoPlaySlider
   */
  startPlayML() {
    this.startPausing();
    if (this.slides && this.slides.length && this.options && this.options.autoplay) {
      this.autoPlaySlider();
    }
  }

  /**
   * Enable autoplay subscription
   */
  autoPlaySlider() {
    if (this.options && this.options.autoplay) {
      const source = interval(this.autoPlayTimer);
      this.autoPlaySub = source.subscribe((cal) => {
        this.next();
        // after some delay we need to set tabindexs for anchors tags
        setTimeout(() => {
          const slide = this.checkRequiredSlidesAndSetActiveItems();
          this.bindTabIndexToAnchorTag(false, slide.minSlideIndex);
        }, 10);
      });
    }
  }

  /**
   * Annouce the current slide active of total slides if param value true
   * @param announce boolen
   */
  setLiveRegion(announce: boolean = false) {
    if (announce) {
      const slide = this.checkRequiredSlidesAndSetActiveItems();
      this.liveregion.nativeElement.textContent = `Carousel item ${slide.activeItems} of ${this.slides.length} is active`;
      this.bindTabIndexToAnchorTag(false, slide.minSlideIndex);
    }
  }

  /**
   * Set tab index for anchor tags if slides are in the viewport else set -1 to tabindex
   * @param initial boolean
   * @param startFrom null | number
   */
  bindTabIndexToAnchorTag(initial: boolean = false, startCounterFrom: null | number = null) {
    // we need to mark all slide tabindex -1
    const activeSlideMin =
      startCounterFrom == null || startCounterFrom == 1
        ? (this.options?.slideBy ? (this.options.slideBy == 0 ? 1 : this.options.slideBy) : 1) * this.selectedDot
        : startCounterFrom;
    const activeSlideMax = activeSlideMin + this.slidesOnPage;
    this.slideBox._results.forEach((item: any, idx: number) => {
      const anchor = item.nativeElement.querySelectorAll('a');
      if (anchor.length) {
        anchor.forEach((ancorTag: HTMLElement) => {
          // if any default tabindex already provide ignore those tags on load
          if (initial && ancorTag.getAttribute('tabindex') == null) ancorTag.classList.add('owl__item__link');

          if (ancorTag.classList.contains('owl__item__link')) {
            let setTabIndex = idx >= activeSlideMin && idx < activeSlideMax ? '0' : '-1';
            ancorTag.setAttribute('tabindex', setTabIndex);
          }
        });
      }
    });
  }

  checkRequiredSlidesAndSetActiveItems(): { minSlideIndex: number; activeItems: string } {
    let slideby = this.options?.slideBy ? (this.options.slideBy == 0 ? 1 : this.options.slideBy) : 1;
    let activeItems = Array.apply(null, Array(this.slidesOnPage))
      .map((x, i) => slideby * this.selectedDot + ++i)
      .filter((i) => this.slides.length >= i)
      .join(', ');

    // here we need to check if which slides are visible in case of required slideby item not avaiable
    let minSlideIndex: number = 1;
    if (activeItems.split(' ').length < slideby) {
      const cActiveItemArr: any = activeItems.split(' ');
      let setCounter = parseInt(cActiveItemArr[cActiveItemArr.length - 1]) - slideby - 1;
      minSlideIndex = setCounter; // -1 that set correct index for first item index is 0;
      activeItems = Array.apply(null, Array(this.slidesOnPage))
        .map((x, i) => ++setCounter)
        .filter((i) => this.slides.length >= i)
        .join(', ');
    }
    return {
      minSlideIndex,
      activeItems,
    };
  }

  ngOnDestroy() {
    if (this.autoPlaySub) {
      this.autoPlaySub.unsubscribe();
    }
    if (this.slidesChangeSubscription) {
      this.slidesChangeSubscription.unsubscribe();
    }
  }

}
