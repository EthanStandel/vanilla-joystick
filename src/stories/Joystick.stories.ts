import { Story, Meta } from "@storybook/html";

import { Joystick, JoystickProps } from "../components/Joystick";
import { GamepadPlugin } from "../components/Joystick/plugins/GamepadPlugin";
import { createListeningElement, modifyElement } from "../utils/createElement";
import { createMutableState } from "../utils/createMutableState";

// More on default export: https://storybook.js.org/docs/html/writing-stories/introduction#default-export
export default {
  title: "Example/Joystick",
  // More on argTypes: https://storybook.js.org/docs/html/api/argtypes
} as Meta;

// More on component templates: https://storybook.js.org/docs/html/writing-stories/introduction#using-args
const Template: Story<Partial<JoystickProps>> = ({ ...props }) => {
  document.body.style.padding = "0";
  const eventState$ = createMutableState();

  return createListeningElement("div", {
    style: {
      height: "100vh",
      width: "100vw",
      overflow: "hidden",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
    children: [
      createListeningElement(
        "code",
        () => ({
          children: new DOMParser().parseFromString(
            JSON.stringify(eventState$.get() ?? {}, undefined, 2)
              .replace(/\n/g, "<br>")
              .replace(/ /g, "&nbsp"),
            "text/html"
          ).body,
          style: {
            height: "3em",
            position: "absolute",
            top: "10px",
            left: "10px",
            zIndex: "1",
          },
        }),
        { eventState$ }
      ),
      createListeningElement("div", {
        style: {
          height: "min(100vh, 100vw)",
          width: "min(100vh, 100vw)",
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "2rem",
        },
        children: createListeningElement("div", {
          style: {
            height: "min(100vh, 100vw)",
            width: "min(100vh, 100vw)",
            aspectRatio: "1/1",
          },
          children: Joystick(props).elementRef,
        }),
      }),
    ],
  });
};

export const Primary = Template.bind({});
// More on args: https://storybook.js.org/docs/html/writing-stories/args
Primary.args = {
  plugins: [
    GamepadPlugin(),
    ({ baseRef, handleRef }) => {
      modifyElement(baseRef, {
        style: {
          borderRadius: "50%",
          background: "gray",
        },
      });

      modifyElement(handleRef, {
        style: {
          background: "red",
          width: "25%",
          height: "25%",
          borderRadius: "50%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          transition: "box-shadow 0.3s ease",
          cursor: "grab",
        },
        children: createListeningElement("span", {
          style: {
            color: "white",
            fontWeight: "bold",
            fontFamily: "arial",
            userSelect: "none",
            textAlign: "center",
          },
          children: document.createTextNode("Drag 🕹 me!"),
        }),
      });
    },
  ],
};
