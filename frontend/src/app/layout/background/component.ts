import {
  Component,
  DOCUMENT,
  DestroyRef,
  type ElementRef,
  afterNextRender,
  computed,
  effect,
  inject,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { ThemeService } from '../../services/theme';
import { type BackgroundRenderer, createBackgroundRenderer } from './renderer';

/**
 * What the background does:
 * - `animating`: continuous loop (drift, ripple, smoothed pointer, theme fade);
 * - `still`: system "reduce motion", one frame per pointer move or theme change, time frozen, no easing;
 * - `paused`: hidden tab (or not started yet), nothing drawn;
 * - `fallback`: no WebGL, the canvas is hidden and a static CSS gradient is shown.
 */
export type BackgroundState = 'animating' | 'still' | 'paused' | 'fallback';

/** Highest device pixel ratio drawn: the halos are blurry anyway, more pixels would only cost. */
const MAX_PIXEL_RATIO = 1.5;
/** Share of the remaining distance the halos cover towards the pointer per 60 Hz frame. */
const POINTER_EASING = 0.05;
/** Duration of the light / dark fade, in seconds. */
const THEME_FADE = 0.3;
/** Longest step between two frames, in seconds: no jump after a slow frame. */
const MAX_STEP = 0.1;
const CENTRE: [number, number] = [0.5, 0.5];
const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';

/**
 * Animated background behind the whole app (spec 013): decides when to draw, the renderer draws.
 * The state is computed from three signals (WebGL available, tab hidden, "reduce motion"); an effect
 * starts or stops the loop when it changes. It is exposed as `data-state`, read by the tests.
 * The pointer is a plain field (no signal): up to 120 events per second, nothing to render in Angular.
 */
@Component({
  selector: 'app-background',
  host: {
    '[attr.data-state]': 'state()',
    '[class.fallback]': "state() === 'fallback'",
  },
  templateUrl: './template.html',
  styleUrl: './template.scss',
})
export class AppBackground {
  private document = inject(DOCUMENT);
  private theme = inject(ThemeService);
  private canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');

  /** `null` until the renderer is created, after the first render. */
  private webgl = signal<boolean | null>(null);
  private hidden = signal(false);
  /** System "reduce motion" preference, followed live. */
  private reducedMotion = signal(false);

  readonly state = computed<BackgroundState>(() => {
    if (this.webgl() === false) return 'fallback';
    if (this.webgl() === null || this.hidden()) return 'paused';
    return this.reducedMotion() ? 'still' : 'animating';
  });

  private renderer: BackgroundRenderer | null = null;
  private motionQuery: MediaQueryList | null = null;
  private resizeObserver: ResizeObserver | null = null;
  /** Pending animation frame (0 = none). */
  private frame = 0;
  private lastTime = 0;
  /** Animated time, in seconds: it stops while paused, so the halos do not jump on resume. */
  private elapsed = 0;
  /** 0 = light, 1 = dark; moves towards the theme in `THEME_FADE` seconds while animating. */
  private dark = 0;
  /** Where the pointer is, and where the halos are on their way to it (0..1 from the bottom left). */
  private pointerTarget: [number, number] = [...CENTRE];
  private pointer: [number, number] = [...CENTRE];

  constructor() {
    afterNextRender(() => this.start());
    inject(DestroyRef).onDestroy(() => this.stop());
    // State or theme changed: start the loop, redraw the still frame, or stop drawing.
    effect(() => {
      const state = this.state();
      this.theme.theme();
      untracked(() => this.run(state));
    });
  }

  private start() {
    const view = this.document.defaultView!;
    const canvas = this.canvas().nativeElement;
    this.renderer = createBackgroundRenderer(canvas);
    if (!this.renderer) {
      this.webgl.set(false);
      return;
    }
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(canvas);
    this.resize();

    const motionQuery = (this.motionQuery = view.matchMedia(REDUCED_MOTION));
    motionQuery.addEventListener('change', this.onMotionChange);
    this.document.addEventListener('visibilitychange', this.onVisibilityChange);
    view.addEventListener('pointermove', this.onPointerMove, { passive: true });
    this.document.documentElement.addEventListener('pointerleave', this.onPointerLeave);

    this.dark = this.darkTarget();
    this.reducedMotion.set(motionQuery.matches);
    this.hidden.set(this.document.visibilityState === 'hidden');
    this.webgl.set(true);
  }

  private stop() {
    this.cancelFrame();
    this.motionQuery?.removeEventListener('change', this.onMotionChange);
    this.document.removeEventListener('visibilitychange', this.onVisibilityChange);
    this.document.defaultView?.removeEventListener('pointermove', this.onPointerMove);
    this.document.documentElement.removeEventListener('pointerleave', this.onPointerLeave);
    this.resizeObserver?.disconnect();
    this.renderer?.dispose();
    this.renderer = null;
  }

  private run(state: BackgroundState) {
    this.cancelFrame();
    if (!this.renderer) return;
    if (state === 'animating') {
      this.lastTime = performance.now();
      this.frame = this.document.defaultView!.requestAnimationFrame(this.tick);
    } else if (state === 'still') {
      this.requestStillFrame();
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
      this.dark = this.darkTarget();
      this.draw(0);
    });
  }

  private resize() {
    const canvas = this.canvas().nativeElement;
    const ratio = Math.min(this.document.defaultView?.devicePixelRatio ?? 1, MAX_PIXEL_RATIO);
    this.renderer?.resize(Math.max(1, Math.round(canvas.clientWidth * ratio)), Math.max(1, Math.round(canvas.clientHeight * ratio)));
    // Resizing clears the canvas: still, it must be drawn again.
    if (this.state() === 'still') this.requestStillFrame();
  }

  private darkTarget() {
    return this.theme.theme() === 'dark' ? 1 : 0;
  }

  private onMotionChange = (event: MediaQueryListEvent) => this.reducedMotion.set(event.matches);

  private onVisibilityChange = () => this.hidden.set(this.document.visibilityState === 'hidden');

  private onPointerMove = (event: PointerEvent) => {
    const view = this.document.defaultView!;
    this.pointerTarget = [event.clientX / view.innerWidth, 1 - event.clientY / view.innerHeight];
    if (this.state() === 'still') this.requestStillFrame();
  };

  /** The pointer left the window: the halos go back to the centre. */
  private onPointerLeave = () => {
    this.pointerTarget = [...CENTRE];
    if (this.state() === 'still') this.requestStillFrame();
  };

  private tick = (now: number) => {
    const step = Math.min((now - this.lastTime) / 1000, MAX_STEP);
    this.lastTime = now;
    this.elapsed += step;
    // Easing independent of the screen refresh rate (60, 120 Hz…).
    const easing = 1 - Math.pow(1 - POINTER_EASING, step * 60);
    this.pointer = [
      this.pointer[0] + (this.pointerTarget[0] - this.pointer[0]) * easing,
      this.pointer[1] + (this.pointerTarget[1] - this.pointer[1]) * easing,
    ];
    // Theme fade: a linear move towards the target, over THEME_FADE seconds.
    const gap = this.darkTarget() - this.dark;
    this.dark += Math.sign(gap) * Math.min(Math.abs(gap), step / THEME_FADE);
    this.draw(this.elapsed);
    this.frame = this.document.defaultView!.requestAnimationFrame(this.tick);
  };

  private draw(time: number) {
    this.renderer?.draw({ pointer: this.pointer, time, dark: this.dark });
  }
}
