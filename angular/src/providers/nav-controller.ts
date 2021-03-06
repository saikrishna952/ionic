import { Location } from '@angular/common';
import { Injectable, Optional } from '@angular/core';
import { NavigationExtras, NavigationStart, Router, UrlTree } from '@angular/router';
import { NavDirection, RouterDirection } from '@ionic/core';

import { IonRouterOutlet } from '../directives/navigation/ion-router-outlet';

import { Platform } from './platform';

export interface AnimationOptions {
  animated?: boolean;
  animationDirection?: 'forward' | 'back';
}

export interface NavigationOptions extends NavigationExtras, AnimationOptions {}

@Injectable({
  providedIn: 'root',
})
export class NavController {

  private topOutlet?: IonRouterOutlet;
  private direction: 'forward' | 'back' | 'root' | 'auto' = DEFAULT_DIRECTION;
  private animated?: NavDirection = DEFAULT_ANIMATED;
  private guessDirection: RouterDirection = 'forward';
  private guessAnimation?: NavDirection;
  private lastNavId = -1;

  constructor(
    platform: Platform,
    private location: Location,
    @Optional() private router?: Router,
  ) {
    // Subscribe to router events to detect direction
    if (router) {
      router.events.subscribe(ev => {
        if (ev instanceof NavigationStart) {
          const id = (ev.restoredState) ? ev.restoredState.navigationId : ev.id;
          this.guessDirection = id < this.lastNavId ? 'back' : 'forward';
          this.guessAnimation = !ev.restoredState ? this.guessDirection : undefined;
          this.lastNavId = this.guessDirection === 'forward' ? ev.id : id;
        }
      });
    }

    // Subscribe to backButton events
    platform.backButton.subscribeWithPriority(0, () => this.pop());
  }

  navigateForward(url: string | UrlTree | any[], options: NavigationOptions = {}): Promise<boolean> {
    this.setDirection('forward', options.animated, options.animationDirection);
    return this.navigate(url, options);
  }

  navigateBack(url: string | UrlTree | any[], options: NavigationOptions = {}): Promise<boolean> {
    this.setDirection('back', options.animated, options.animationDirection);
    return this.navigate(url, options);
  }

  navigateRoot(url: string | UrlTree | any[], options: NavigationOptions = {}): Promise<boolean> {
    this.setDirection('root', options.animated, options.animationDirection);
    return this.navigate(url, options);
  }

  private navigate(url: string | UrlTree | any[], options: NavigationOptions) {
    if (Array.isArray(url)) {
      return this.router!.navigate(url, options);
    } else {
      return this.router!.navigateByUrl(url, options);
    }
  }

  back(options: AnimationOptions = { animated: true, animationDirection: 'back' }) {
    this.setDirection('back', options.animated, options.animationDirection);
    return this.location.back();
   }

  async pop() {
    let outlet = this.topOutlet;

    while (outlet) {
      if (await outlet.pop()) {
        break;
      } else {
        outlet = outlet.parentOutlet;
      }
    }
   }

  setDirection(direction: RouterDirection, animated?: boolean, animationDirection?: 'forward' | 'back') {
    this.direction = direction;
    this.animated = getAnimation(direction, animated, animationDirection);
  }

  setTopOutlet(outlet: IonRouterOutlet) {
    this.topOutlet = outlet;
  }

  consumeTransition() {
    let direction: RouterDirection = 'root';
    let animation: NavDirection | undefined;

    if (this.direction === 'auto') {
      direction = this.guessDirection;
      animation = this.guessAnimation;
    } else {
      animation = this.animated;
      direction = this.direction;
    }
    this.direction = DEFAULT_DIRECTION;
    this.animated = DEFAULT_ANIMATED;

    return {
      direction,
      animation
    };
  }
}

function getAnimation(direction: RouterDirection, animated: boolean | undefined, animationDirection: 'forward' | 'back' | undefined): NavDirection | undefined {
  if (animated === false) {
    return undefined;
  }
  if (animationDirection !== undefined) {
    return animationDirection;
  }
  if (direction === 'forward' || direction === 'back') {
    return direction;
  } else if (direction === 'root' && animated === true) {
    return 'forward';
  }
  return undefined;
}

const DEFAULT_DIRECTION = 'auto';
const DEFAULT_ANIMATED = undefined;
