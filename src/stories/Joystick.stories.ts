import { Story, Meta } from "@storybook/html";

import { Joystick, JoystickProps } from "../components/Joystick";
import { GamepadPlugin } from "../components/Joystick/plugins/GamepadPlugin";
import { PointerPlugin } from "../components/Joystick/plugins/PointerPlugin";
import { h, m } from "../utils/createElement";
import { createMutableState } from "../utils/createMutableState";

import classes from "./Joystick.stories.module.css";

// More on default export: https://storybook.js.org/docs/html/writing-stories/introduction#default-export
export default {
  title: "Example/Joystick",
  // More on argTypes: https://storybook.js.org/docs/html/api/argtypes
} as Meta;

// More on component templates: https://storybook.js.org/docs/html/writing-stories/introduction#using-args
const Template: Story<Partial<JoystickProps>> = ({ ...props }) => {
  document.body.style.padding = "0";
  const parser = new DOMParser();
  const eventState$ = createMutableState();

  return h("div", {
    className: classes.storyRoot,
    children: [
      h(
        "code",
        {
          className: classes.latestEvent,
        },
        {
          props: () => ({
            children: parser.parseFromString(
              JSON.stringify(eventState$.get() ?? {}, undefined, 2)
                .replace(/\n/g, "<br>")
                .replace(/ /g, "&nbsp"),
              "text/html"
            ).body,
          }),
          deps: { eventState$ },
        }
      ),
      h("div", {
        className: classes.joystickContainer,
        children: Joystick({
          ...props,
          onMove: (event) => eventState$.set(event),
        }).elementRef,
      }),
    ],
  });
};

export const Primary = Template.bind({});
// More on args: https://storybook.js.org/docs/html/writing-stories/args
Primary.args = {
  plugins: [
    GamepadPlugin(),
    PointerPlugin(),
    ({ baseRef, handleRef }) => {
      m(baseRef, {
        className: classes.styledBase,
      });
      m(handleRef, {
        className: classes.styledHandle,
        children: h("span", {
          className: classes.handleChild,
          children: document.createTextNode("Drag 🕹 me!"),
        }),
      });
    },
  ],
};
