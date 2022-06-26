import { MutableState } from "./createMutableState";

export type ElementModifiers = {
  children?: HTMLElement | Text | Array<HTMLElement | Text>;
  style?: Partial<CSSStyleDeclaration>;
};

export const createListeningElement = <K extends keyof HTMLElementTagNameMap>(
  tagName: K,
  modifiers?: (() => ElementModifiers) | ElementModifiers,
  states?: Record<string, MutableState<any>>
): HTMLElementTagNameMap[K] => {
  const element = document.createElement(tagName);
  return modifyElement(element, modifiers, states);
};

export const modifyElement = <E extends HTMLElement>(
  element: E,
  modifiers: (() => ElementModifiers) | ElementModifiers = {},
  states: Record<string, MutableState<any>> = {}
) => {
  const modifyElement = () => {
    const { children, style = {} } =
      typeof modifiers === "function" ? modifiers() : modifiers;
    if (Array.isArray(children)) {
      children.forEach((child) => element.appendChild(child));
    } else if (children) {
      element.append(children);
    }

    Object.assign(element.style, style);
  };

  modifyElement();

  Object.values(states).forEach((state) =>
    state.subscribe(() => modifyElement())
  );

  return element;
};
