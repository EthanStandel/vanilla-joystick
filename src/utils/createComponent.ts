import { MutableState } from "./createMutableState";

export const createComponent = <
  Props,
  ComponentResponse extends {
    elementRef: HTMLElement;
    states: Record<string, MutableState<any>>;
  }
>(
  functionalComponent: (props: Props) => ComponentResponse
) => {
  return (props: Props) => {
    const component = functionalComponent(props);
    const observer = new MutationObserver((mutationList) =>
      mutationList.forEach((mutation) => {
        Array.from(mutation.removedNodes).forEach((node) => {
          if (node === component.elementRef) {
            cleanup();
          }
        });
      })
    );

    const cleanup = () => {
      observer.disconnect();
      Object.values(component.states).forEach((state) =>
        state.clearSubscribers()
      );
    };

    return {
      ...component,
      // call this to manually clean up event listeners
      cleanup,
      // call this once the element has been mounted
      cleanupListener: () => {
        observer.observe(component.elementRef);
      },
    };
  };
};
