import {
  initialStates,
  JoystickPlugin,
  JoystickPluginProps,
} from "../Joystick";

/**
 * This plugin enables click and single-touch event handling at high-performance.
 */
export const PointerPlugin =
  ({ disableReset = false } = {}): JoystickPlugin =>
  ({
    disableX,
    disableY,
    handleState,
    handleHandleMove,
    handleRef,
    states: { offset$, shouldTransition$ },
    onMove,
    pluginIndex,
  }: JoystickPluginProps) => {
    const handlePointerMove = (event: PointerEvent) => {
      event.preventDefault();
      const xOffset = disableX
        ? 0
        : event.clientX - handleState.initialOffsets.x;
      const yOffset = disableY
        ? 0
        : event.clientY - handleState.initialOffsets.y;
      handleHandleMove(xOffset, yOffset);
    };

    const handlePointerUp = () => {
      window.removeEventListener("pointermove", handlePointerMove);
      shouldTransition$.set(true);
      if (!disableReset) {
        Object.assign(handleState, initialStates.handleState());
        offset$.set({ x: 0, y: 0 });
        onMove?.(initialStates.eventState());
      }
    };

    handleRef.addEventListener("pointerdown", (event: PointerEvent) => {
      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", handlePointerUp, { once: true });
      shouldTransition$.set(false);
      if (!disableReset || !handleState.pluginDragging[pluginIndex]) {
        Object.assign(handleState, {
          initialOffsets: {
            x: event.clientX,
            y: event.clientY,
          },
        });
        handleState.pluginDragging[pluginIndex] = true;
      }
    });
  };
