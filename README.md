# print-layout

Prints a hierarchical node tree as compact, human-readable text. Designed for inspecting UI layout trees in logs and debug output.

## Usage

```ts
import { printLayout } from "print-layout";

const output = printLayout(node, options?);
```

### Node shape

```ts
type LayoutNode = {
  type: string;        // node type name
  tag?: string;        // identifier, e.g. "[app.Header]" or "*button"
  content?: string[];  // text content strings
  children?: LayoutNode[];
};
```

## Example output

```
View *root
  ScrollView
  ├ View [0]
  │   Container
  │     View [1.0]
  │       Text ("A1")
  │       Text ("A2")
  │     View [1.1]
  │       Text ("A3")
  └ View ▶ View ▶ Container
    ├ View [1.0]
    │   Text ("B1")
    ├ View [1.1]
    │   View [1.1.0]",
    │     Text ("C1")
    └ View [1.2]
        Text ("B2")
```

## Output conventions

**Tags** appear after the type name: `View [app.Header]`, `Button *submit`.

**Content** is shown inline in quotes when it fits: `Text ("Hello" "World")`. When it doesn't fit within `maxLength`, it wraps onto subsequent lines with the same indentation.

**Chain collapsing** — a node with a single child and no tag or content is collapsed into a chain with `▶`: `View ▶ View ▶ Container`.

**Indentation guides** (`├`, `└`, `│`) appear when a parent has two or more children that themselves have children, making it easier to follow nesting across multiple lines.

**Type compression** — when a line exceeds `maxLength`, long fully-qualified type names are shortened with `..`: `com.android.widget.VeryLongWidget` → `com.an..Widget`. Tags are compressed only after the type is at its minimum length.
