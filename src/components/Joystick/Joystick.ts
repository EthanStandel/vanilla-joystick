import { Trig } from "../../utils/Trig";
import { createComponent } from "../../utils/createComponent";
import { createListeningElement } from "../../utils/createElement";
import {
  createMutableState,
  MutableState,
} from "../../utils/createMutableState";

export const Joystick = createComponent(
  (initialProps: Partial<JoystickProps>) => {
    const props = initialStates.mergePropsWithDefaults(initialProps);
    const offset$ = createMutableState({ x: 0, y: 0 });
    const shouldTransition$ = createMutableState(false);
    const handleState = initialStates.handleState();
    const handleRef = createListeningElement(
      "button",
      () => ({
        style: styles.handle(
          offset$.get().x,
          offset$.get().y,
          shouldTransition$.get() && !props.disableResetAnimation,
          props.resetAnimation
        ),
      }),
      { offset$, shouldTransition$ }
    );
    const baseRef = createListeningElement("div", {
      children: handleRef,
      style: styles.base,
    });

    const getRadius = () => {
      const edgeBoundingModifier =
        props.boundingModel === "inner" || props.boundingModel === "outer"
          ? Math.max(handleRef.clientWidth, handleRef.clientHeight) / 2
          : 0;
      return (
        baseRef.clientWidth / 2 +
        (props.boundingModel === "outer"
          ? edgeBoundingModifier
          : -edgeBoundingModifier) +
        props.boundaryModifier
      );
    };

    const onMoveThrottled = (() => {
      if (props.throttleEventsBy !== 0) {
        let lastTime = 0;
        return (event: JoystickMoveEvent) => {
          const now = new Date().getTime();
          if (now - lastTime >= props.throttleEventsBy) {
            lastTime = now;
            props.onMove(event);
          }
        };
      } else {
        return props.onMove;
      }
    })();

    const handleHandleMove = (xOffset: number, yOffset: number) => {
      const radius = getRadius();
      if (
        handleState.pluginDragging.some((dragging) => dragging) &&
        !handleRef.disabled
      ) {
        const offsetHypotenuse = Trig.hypotenuse(xOffset, yOffset);
        const radians = Trig.angleRadians(xOffset, yOffset);
        const handleXOffset = props.disableX
          ? 0
          : offsetHypotenuse < radius || props.boundingModel === "none"
          ? xOffset
          : Trig.getMaxX(radians, radius);
        const handleYOffset = props.disableY
          ? 0
          : offsetHypotenuse < radius || props.boundingModel === "none"
          ? yOffset
          : Trig.getMaxY(radians, radius);
        offset$.set({ x: handleXOffset, y: handleYOffset });

        onMoveThrottled?.({
          offset: {
            pixels: { x: handleXOffset, y: handleYOffset },
            percentage: {
              x: handleXOffset / radius,
              y: handleYOffset / radius,
            },
          },
          angle: {
            radians: radians,
            degrees: Trig.radiansToDegrees(radians),
          },
          pressure: {
            pixels:
              offsetHypotenuse > radius && props.boundingModel !== "none"
                ? radius
                : offsetHypotenuse,
            percentage:
              offsetHypotenuse > radius && props.boundingModel !== "none"
                ? 1
                : Math.abs(offsetHypotenuse / radius),
          },
        });
      }
    };

    props.onMove(initialStates.eventState());

    props.plugins.forEach((plugin, pluginIndex) => {
      plugin({
        states: {
          offset$,
          shouldTransition$,
        },
        getRadius,
        handleHandleMove,
        handleState,
        pluginIndex,
        handleRef,
        baseRef,
        ...props,
      });
    });

    return {
      baseRef,
      handleRef,
      elementRef: baseRef,
      states: {
        offset$,
        shouldTransition$,
      },
    };
  }
);

/**
 * Props for the Joystick component.
 **/
export type JoystickProps = {
  /**
   * The event that fires when the joystick is moved.
   **/
  onMove: (event: JoystickMoveEvent) => void;

  /**
   * The model that defines the way the handle will be contained inside of the base.
   *
   * "inner" will ensure that the handle is always contained by baseing the handle's distance from center by it's own far edge
   *
   * "center" will base the handle's distance from center by the center of the handle, allowing it to partially overflow
   *
   * "outer" will base the handle's distance from center by the outer edge of the handle, allowing it to fully overflow
   *
   * "none" will make it so that there is no boundy
   *
   * default: "center"
   **/
  boundingModel: "inner" | "center" | "outer" | "none";

  /**
   * A number of pixels to modify the boundary. Negative shrinks, positive grows.
   * default: 0
   **/
  boundaryModifier: number;

  /**
   * Disables the handle from all movement
   **/
  disabled: boolean;

  /**
   * Disables the x axis, limiting use to the y axis, if enabled
   **/
  disableX: boolean;

  /**
   * Disables the y axis, limiting use to the x axis, if enabled.
   **/
  disableY: boolean;

  /**
   * Disable the transition animation that resets the handle location after "letting go."
   **/
  disableResetAnimation: boolean;

  /**
   * Defines the animation that fires for the reset event after "letting go" of the handle.
   * default: ".2s ease"
   **/
  resetAnimation: string;

  /**
   * A time in milliseconds that incoming events should be throttled by, recommended if connected to a websocket.
   * default: 0
   **/
  throttleEventsBy: number;

  /**
   * An array of plugins that can be used to modify props and state of the Joystick. This is how controls are provided to the Joystick component.
   *
   * **WARNING** All standard Joystick plugins will be tested on their own, but not against each other. Mix and match at your own risk (feel free to file bugs, but they may be marked `wontfix`).
   */
  plugins: Array<JoystickPlugin>;
};

/**
 * The data which is forwarded when the handle is moved.
 **/
export type JoystickMoveEvent = {
  /**
   * The offset that the handle has been dragged from its initial position, offered in both pixels & percentage.
   **/
  offset: {
    pixels: { x: number; y: number };
    percentage: { x: number; y: number };
  };

  /**
   * The angle that the joystick has been dragged, offered in both radians & degrees.
   **/
  angle: { radians: number; degrees: number };

  /**
   * The total distance that the handle has been dragged from the center of the base, offered in both pixels & percentage.
   **/
  pressure: { pixels: number; percentage: number };
};

/**
 * A function which may be used to modify the props and state of the Joystick.
 */
export type JoystickPlugin = (
  pluginProps: {
    /**
     * The function that should be called when a controlling event wants the handle to move and fire off an `JoystickMoveEvent`.
     */
    handleHandleMove: (xOffset: number, yOffset: number) => void;
    /**
     * A getter for the radius of the "base" element.
     */
    getRadius: () => number;
    /**
     * A signal accessor for the currently rendered true xOffset of the handle.
     */
    states: {
      /**
       * A signal accessor for the currently rendered true offset of the handle.
       */
      offset$: MutableState<{ x: number; y: number }>;
      /**
       * A signal accessor for the enabling boolean for the return-to-center transition.
       */
      shouldTransition$: MutableState<boolean>;
    };
    /**
     * The indexed order this plugin is being added to the array.
     */
    pluginIndex: number;
    /**
     * A non-observed state container. When dragging the handle, you should set `handleState.pluginDragging[pluginIndex] = true` and when the handle is "let go of," you should set that to false. When done dragging, always set `handleState.initialOffsets = { x: 0, y: 0 }` if it was modified.
     */
    handleState: {
      pluginDragging: Array<boolean>;
      initialOffsets: { x: number; y: number };
    };
    /**
     * A ref for the handle element.
     */
    handleRef: HTMLButtonElement;

    /**
     * A ref for the base element.
     */
    baseRef: HTMLDivElement;
  } & JoystickProps
) => void;

export const initialStates = {
  handleState: () => ({
    pluginDragging: [] as Array<boolean>,
    initialOffsets: { x: 0, y: 0 },
  }),
  eventState: () => ({
    offset: {
      pixels: { x: 0, y: 0 },
      percentage: { x: 0, y: 0 },
    },
    angle: { radians: 0, degrees: 0 },
    pressure: { pixels: 0, percentage: 0 },
  }),
  mergePropsWithDefaults: (props: Partial<JoystickProps>): JoystickProps =>
    Object.assign(props, {
      onMove: props.onMove ?? ((() => undefined) as JoystickProps["onMove"]),
      disableResetAnimation: props.disableResetAnimation ?? false,
      disabled: props.disabled ?? false,
      disableX: props.disableX ?? false,
      disableY: props.disableY ?? false,
      boundingModel: props.boundingModel ?? "center",
      boundaryModifier: props.boundaryModifier ?? 0,
      throttleEventsBy: props.throttleEventsBy ?? 0,
      resetAnimation: props.resetAnimation ?? ".2s ease",
      plugins: props.plugins ?? [],
    }),
};

const styles = {
  base: {
    width: "100%",
    height: "100%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  handle: (
    x: number,
    y: number,
    shouldTransition: boolean,
    resetAnimation?: string
  ) => ({
    touchAction: "none",
    transform: `translate(${x}px,${y}px)`,
    ...(shouldTransition
      ? { transition: `all ${resetAnimation}` }
      : { transition: "none" }),
  }),
};
