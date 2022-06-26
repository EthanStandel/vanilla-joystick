import { MutableState } from "./createMutableState";

export type ElementProps = {
  children?: HTMLElement | Text | Array<HTMLElement | Text>;
  style?: Partial<CSSStyleDeclaration>;
  className?: string;
};

export type DynamicElementProps = {
  props: () => ElementProps;
  deps: Record<string, MutableState<any>>;
};

export const createElement = <K extends keyof HTMLElementTagNameMap>(
  tagName: K,
  ...props: Array<ElementProps | DynamicElementProps>
): HTMLElementTagNameMap[K] => {
  const element = document.createElement(tagName);
  return modifyElement(element, ...props);
};

export const modifyElement = <E extends HTMLElement>(
  element: E,
  ...incomingProps: Array<ElementProps | DynamicElementProps>
) => {
  incomingProps.forEach((propBase) => {
    const dependencies = "deps" in propBase ? propBase.deps : {};
    const modifyElement = () => {
      const props = "deps" in propBase ? propBase.props() : propBase;
      rotateElementChildren(element, props.children);
      rotateClassName(element, props.className);
      Object.assign(element.style, props.style);
    };

    modifyElement();

    Object.values(dependencies).forEach((state) =>
      state.subscribe(() => modifyElement())
    );
  });

  return element;
};

const rotateClassName = <E extends HTMLElement>(
  element: E,
  className?: string
) => {
  if (className) {
    element.className = className;
  }
};
const rotateElementChildren = <E extends HTMLElement>(
  element: E,
  children?: HTMLElement | Text | Array<HTMLElement | Text>
) => {
  if (children) {
    // if we have a children assignment, they should be the only children
    // so clear out any previous children
    while (element.firstChild) {
      element.removeChild(element.firstChild);
    }
    if (Array.isArray(children)) {
      children.forEach((child) => element.appendChild(child));
    } else {
      element.append(children);
    }
  }
};

// https://css-tricks.com/what-does-the-h-stand-for-in-vues-render-method/
export const h = createElement;
export const m = modifyElement;
