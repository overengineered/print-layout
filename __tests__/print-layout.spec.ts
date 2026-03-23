import { printLayout } from "../src/index";

describe("printLayout", () => {
  it("should print simple layout", () => {
    const lines = printLayout({
      type: "View",
      tag: "[app.Header]",
      children: [],
    }).split("\n");

    expect(lines).toEqual(["View [app.Header]"]);
  });

  it("should print nested layout", () => {
    const lines = printLayout({
      type: "View",
      children: [
        { type: "Text", content: ["Line 1", "Line 2"] },
        { type: "Button", tag: "*button", content: ["OK"] },
      ],
    }).split("\n");

    expect(lines).toEqual([
      "View",
      '  Text ("Line 1" "Line 2")',
      '  Button *button ("OK")',
    ]);
  });

  it("should print text on subsequent lines with wrapping when it doesn't fit on one line", () => {
    const lines = printLayout(
      {
        type: "Text",
        content: ["123456789012345678901234567890"],
      },
      { maxLength: 10 },
    ).split("\n");

    expect(lines).toEqual([
      "Text",
      '"123456789',
      '"012345678',
      '"901234567',
      '"890"',
    ]);
  });

  it("should print long content with indentation matching the parent", () => {
    const lines = printLayout(
      {
        type: "View",
        tag: "[X]",
        children: [
          { type: "Text", content: ["12345678901234567890", "ABCDEF"] },
        ],
      },
      { maxLength: 10 },
    ).split("\n");

    expect(lines).toEqual([
      "View [X]",
      "  Text",
      '  "123456789',
      '  "012345678',
      '  "90" "ABCD',
      '  "EF"',
    ]);
  });

  it("should compress long types names when needed", () => {
    const lines = printLayout(
      {
        type: "com.android.widget.important.package.VeryObscureWidget",
        tag: "[ID]",
      },
      { maxLength: 20 },
    ).split("\n");

    expect(lines).toEqual(["com.and..Widget [ID]"]);
  });

  it("should prefer compressing type over tag", () => {
    const lines = printLayout(
      {
        type: "com.android.widget.important.package.VeryObscureWidget",
        tag: "[LONGISH_TAG]",
      },
      { maxLength: 20 },
    ).split("\n");

    expect(lines).toEqual(["co..et [LONGISH_TAG]"]);
  });

  it("should compress tag after type is compressed to 6 characters", () => {
    const lines = printLayout(
      {
        type: "com.android.widget.important.package.VeryObscureWidget",
        tag: "[MUCH_LONGER_TAG]",
      },
      { maxLength: 20 },
    ).split("\n");

    expect(lines).toEqual(["co..et [MUCH_.._TAG]"]);
  });

  it("should compress tag and type together when running out of space", () => {
    const lines = printLayout(
      {
        type: "com.android.widget.important.package.VeryObscureWidget",
        tag: "*SOME_TAG",
      },
      { maxLength: 6 },
    ).split("\n");

    expect(lines).toEqual(["co..AG"]);
  });

  it("should adjust indentation with markings when after compressing type output still doesn't fit on one line if that helps preserving full tag", () => {
    const lines = printLayout(
      {
        type: "View",
        tag: "[app.Main]",
        children: [
          {
            type: "ScrollView",
            tag: "[app.Items]",
            children: [
              {
                type: "Header",
                tag: "[app.Header]",
                children: [
                  { type: "ImportantWidget", tag: "[app.ImportantWidget]" },
                  {
                    type: "View",
                    tag: "[app.Wrapper]",
                    children: [
                      { type: "ImportantWidget", tag: "[app.ImportantWidget]" },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
      { maxLength: 32 },
    ).split("\n");

    expect(lines).toEqual([
      "View [app.Main]",
      "  ScrollView [app.Items]",
      "    Header [app.Header]",
      "«2« Im..et [app.ImportantWidget]",
      "      View [app.Wrapper]",
      "«4« Im..et [app.ImportantWidget]",
    ]);
  });

  it("should print multiple types in one line when parent has only one child and no tag or content", () => {
    const lines = printLayout({
      type: "ScrollView",
      children: [
        { type: "View", children: [{ type: "Text", content: ["ABC"] }] },
        {
          type: "View",
          tag: "[Wrapper]",
          children: [{ type: "Button", content: ["OK"] }],
        },
        {
          type: "View",
          children: [
            {
              type: "View",
              children: [
                {
                  type: "View",
                  children: [
                    { type: "Text", content: ["123"] },
                    { type: "Text", content: ["456"] },
                  ],
                },
              ],
            },
          ],
        },
      ],
    }).split("\n");

    expect(lines).toEqual([
      "ScrollView",
      '  View ▶ Text ("ABC")',
      "  View [Wrapper]",
      '    Button ("OK")',
      "  View ▶ View ▶ View",
      '    Text ("123")',
      '    Text ("456")',
    ]);
  });

  it("should print children when parent has content and children", () => {
    const lines = printLayout({
      type: "View",
      content: ["ABC"],
      children: [{ type: "Text", content: ["123"] }],
    }).split("\n");

    expect(lines).toEqual(['View ("ABC")', '  Text ("123")']);
  });

  it("should add indentation level guides when parent is not root and has at least two children that have their own children", () => {
    const lines = printLayout({
      type: "View",
      children: [
        {
          type: "ScrollView",
          children: [
            {
              type: "View",
              tag: "[0]",
              children: [{ type: "Text", content: ["A"] }],
            },
            {
              type: "View",
              tag: "[1]",
              children: [{ type: "Text", content: ["B"] }],
            },
          ],
        },
        { type: "Button", tag: "[CTA]", children: [{ type: "Icon" }] },
      ],
    }).split("\n");

    expect(lines).toEqual([
      "View",
      "├ ScrollView",
      "│   View [0]",
      '│     Text ("A")',
      "│   View [1]",
      '│     Text ("B")',
      "└ Button [CTA]",
      "    Icon",
    ]);
  });

  it("should allow several levels of guided indentation", () => {
    const lines = printLayout({
      type: "View",
      tag: "*root",
      children: [
        {
          type: "ScrollView",
          children: [
            {
              type: "View",
              tag: "[0]",
              children: [
                {
                  type: "Container",
                  children: [
                    {
                      type: "View",
                      tag: "[1.0]",
                      children: [
                        { type: "Text", content: ["B1"] },
                        { type: "Text", content: ["B2"] },
                      ],
                    },
                    {
                      type: "View",
                      tag: "[1.1]",
                      children: [{ type: "Text", content: ["C1"] }],
                    },
                  ],
                },
              ],
            },
            {
              type: "View",
              children: [
                {
                  type: "View",
                  children: [
                    {
                      type: "Container",
                      children: [
                        {
                          type: "View",
                          tag: "[1.0]",
                          children: [{ type: "Text", content: ["B1"] }],
                        },
                        {
                          type: "View",
                          tag: "[1.1]",
                          children: [
                            {
                              type: "View",
                              tag: "[1.1.0]",
                              children: [{ type: "Text", content: ["C1"] }],
                            },
                          ],
                        },
                        {
                          type: "View",
                          tag: "[1.2]",
                          children: [{ type: "Text", content: ["D1"] }],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    }).split("\n");

    expect(lines).toEqual([
      "View *root",
      "  ScrollView",
      "  ├ View [0]",
      "  │   Container",
      "  │     View [1.0]",
      '  │       Text ("B1")',
      '  │       Text ("B2")',
      "  │     View [1.1]",
      '  │       Text ("C1")',
      "  └ View ▶ View ▶ Container",
      "    ├ View [1.0]",
      '    │   Text ("B1")',
      "    ├ View [1.1]",
      "    │   View [1.1.0]",
      '    │     Text ("C1")',
      "    └ View [1.2]",
      '        Text ("D1")',
    ]);
  });

  it("should not print guided indentation when children of children collapse into a chain", () => {
    const lines = printLayout({
      type: "UITabBar",
      tag: "[tabs]",
      children: [
        {
          type: "_UIBarBackground",
          children: [
            { type: "UIImageView" },
            {
              type: "_UIBarBackgroundShadowView",
              children: [{ type: "_UIBarBackgroundShadowContentImageView" }],
            },
            {
              type: "_UIBarBackgroundShadowView",
              children: [{ type: "_UIBarBackgroundShadowContentImageView" }],
            },
          ],
        },
      ],
    }).split("\n");

    expect(lines).toEqual([
      "UITabBar [tabs]",
      "  _UIBarBackground",
      "    UIImageView",
      "    _UIBarBackgroundShadowView ▶ _UIBarBackgroundShadowContentImageView",
      "    _UIBarBackgroundShadowView ▶ _UIBarBackgroundShadowContentImageView",
    ]);
  });

  it("should print guided indentation for each child, not just the ones that have children", () => {
    const lines = printLayout({
      type: "UITabBar",
      tag: "[tabs]",
      children: [
        {
          type: "_UIBarBackground",
          children: [
            { type: "UIImageView" },
            {
              type: "_UIBarBackgroundShadowView",
              tag: "[tab1]",
              children: [
                {
                  type: "_UIBarBackgroundShadowContentImageView",
                  tag: "*active",
                  children: [{ type: "UIImageView" }],
                },
              ],
            },
            {
              type: "_UIBarBackgroundShadowView",
              tag: "[tab2]",
              children: [{ type: "_UIBarBackgroundShadowContentImageView" }],
            },
            { type: "UIImageView" },
          ],
        },
      ],
    }).split("\n");

    expect(lines).toEqual([
      "UITabBar [tabs]",
      "  _UIBarBackground",
      "  ├ UIImageView",
      "  ├ _UIBarBackgroundShadowView [tab1]",
      "  │   _UIBarBackgroundShadowContentImageView *active",
      "  │     UIImageView",
      "  ├ _UIBarBackgroundShadowView [tab2]",
      "  │   _UIBarBackgroundShadowContentImageView",
      "  └ UIImageView",
    ]);
  });
});
