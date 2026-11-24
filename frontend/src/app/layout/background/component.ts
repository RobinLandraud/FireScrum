import {
  Component,
  DOCUMENT,
  DestroyRef,
  type ElementRef,
  afterNextRender,
  effect,
  inject,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { ThemeService } from '../../services/theme';
import { type BackgroundRenderer, createBackgroundRenderer } from './renderer';

/** Highest device pixel ratio drawn: the halos are blurry anyway, more pixels would only cost. */
const MAX_PIXEL_RATIO = 1.5;
/** Share of the remaining distance the halos cover towards the pointer per 60 Hz frame. */
const POINTER_EASING = 0.05;
const CENTRE: [number, number] = [0.5, 0.5];
const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';

/**
 * Animated background behind the whole app (spec 013): decides when to draw, the renderer draws.
 * - Normal: a continuous loop (drift, ripple, smoothed pointer).
 * - System "reduce motion": still, one frame drawn per pointer move or theme change, time frozen, no easing.
 * - No WebGL: the canvas is hidden and a static CSS gradient is shown instead.
 * The pointer is a plain field (no signal): up to 120 events per second, nothing to render in Angular.
 */
@Component({
  selector: 'app-background',
  host: { '[class.fallback]': 'fallback()' },
  templateUrl: './template.html',
  styleUrl: './template.scss',
})
export class AppBackground {
  private document = inject(DOCUMENT);
  private theme = inject(ThemeService);
  private canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');

  /** No WebGL, or the shader does not compile. */
  protected fallback = signal(false);
  /** System "reduce motion" preference, followed live. */
  private reducedMotion = signal(false);

  private renderer: BackgroundRenderer | null = null;
  private motionQuery: MediaQueryList | null = null;
  private resizeObserver: ResizeObserver | null = null;
  /** Pending animation frame (0 = none). */
  private frame = 0;
  private startTime = 0;
  private lastTime = 0;
  /** Where the pointer is, and where the halos are on their way to it (0..1 from the bottom left). */
  private pointerTarget: [number, number] = [...CENTRE];
  private pointer: [number, number] = [...CENTRE];

  constructor() {
    afterNextRender(() => this.start());
    inject(DestroyRef).onDestroy(() => this.stop());
    // Motion preference or theme changed: restart the loop, or redraw the still frame.
    effect(() => {
      const still = this.reducedMotion();
      this.theme.theme();
      untracked(() => this.run(still));
    });
  }

  private start() {
    const canvas = this.canvas().nativeElement;
    this.renderer = createBackgroundRenderer(canvas);
    if (!this.renderer) {
      this.fallback.set(true);
      return;
    }
    const view = this.document.defaultView!;
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(canvas);
    this.resize();

    const motionQuery = (this.motionQuery = view.matchMedia(REDUCED_MOTION));
    motionQuery.addEventListener('change', this.onMotionChange);
    view.addEventListener('pointermove', this.onPointerMove, { passive: true });
    this.document.documentElement.addEventListener('pointerleave', this.onPointerLeave);

    this.startTime = this.lastTime = performance.now();
    this.reducedMotion.set(motionQuery.matches);
    this.run(this.reducedMotion());
  }

  private stop() {
    this.cancelFrame();
    this.motionQuery?.removeEventListener('change', this.onMotionChange);
    this.document.defaultView?.removeEventListener('pointermove', this.onPointerMove);
    this.document.documentElement.removeEventListener('pointerleave', this.onPointerLeave);
    this.resizeObserver?.disconnect();
    this.renderer?.dispose();
    this.renderer = null;
  }

  /** Continuous loop, or a single still frame. */
  private run(still: boolean) {
    this.cancelFrame();
    if (!this.renderer) return;
    if (still) {
      this.requestStillFrame();
    } else {
      this.lastTime = performance.now();
      this.frame = this.document.defaultView!.requestAnimationFrame(this.tick);
    }
  }

  private cancelFrame() {
    if (this.frame) this.document.defaultView?.cancelAnimationFrame(this.frame);
    this.frame = 0;
  }

  /** Still: one frame at the next repaint, however many pointer events arrive before it. */
  private requestStillFrame() {
    if (this.frame || !this.renderer) return;
    this.frame = this.document.defaultView!.requestAnimationFrame(() => {
      this.frame = 0;
      this.pointer = [...this.pointerTarget];
      this.draw(0);
    });
  }

  private resize() {
    const canvas = this.canvas().nativeElement;
    const ratio = Math.min(this.document.defaultView?.devicePixelRatio ?? 1, MAX_PIXEL_RATIO);
    this.renderer?.resize(Math.max(1, Math.round(canvas.clientWidth * ratio)), Math.max(1, Math.round(canvas.clientHeight * ratio)));
    // Resizing clears the canvas: still, it must be drawn again.
    if (this.reducedMotion()) this.requestStillFrame();
  }

  private onMotionChange = (event: MediaQueryListEvent) => this.reducedMotion.set(event.matches);

  private onPointerMove = (event: PointerEvent) => {
    const view = this.document.defaultView!;
    this.pointerTarget = [event.clientX / view.innerWidth, 1 - event.clientY / view.innerHeight];
    if (this.reducedMotion()) this.requestStillFrame();
  };

  /** The pointer left the window: the halos go back to the centre. */
  private onPointerLeave = () => {
    this.pointerTarget = [...CENTRE];
    if (this.reducedMotion()) this.requestStillFrame();
  };

  private tick = (now: number) => {
    // Easing independent of the screen refresh rate (60, 120 Hz…).
    const easing = 1 - Math.pow(1 - POINTER_EASING, ((now - this.lastTime) / 1000) * 60);
    this.lastTime = now;
    this.pointer = [
      this.pointer[0] + (this.pointerTarget[0] - this.pointer[0]) * easing,
      this.pointer[1] + (this.pointerTarget[1] - this.pointer[1]) * easing,
    ];
    this.draw((now - this.startTime) / 1000);
    this.frame = this.document.defaultView!.requestAnimationFrame(this.tick);
  };

  private draw(time: number) {
    this.renderer?.draw({ pointer: this.pointer, time, dark: this.theme.theme() === 'dark' ? 1 : 0 });
  }
}
