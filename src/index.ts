// Written by Claude Opus 4.6

type LayoutNode = {
  type: string;
  tag?: string;
  content?: string[];
  children?: LayoutNode[];
};

export function printLayout(
  node: LayoutNode,
  options: { maxLength?: number } = {},
): string {
  const { maxLength = 132 } = options;
  return renderNode(node, "", maxLength).join("\n");
}

const MIN_TYPE = 6;

function compress(s: string, max: number): string {
  if (s.length <= max) return s;
  if (max <= 2) return s.slice(0, max);
  const pre = Math.ceil((max - 2) / 2);
  const suf = max - 2 - pre;
  return suf > 0 ? s.slice(0, pre) + ".." + s.slice(-suf) : s.slice(0, max);
}

function compressTag(tag: string, max: number): string {
  if (tag.length <= max) return tag;
  if (tag.startsWith("[") && tag.endsWith("]")) {
    return "[" + compress(tag.slice(1, -1), max - 2) + "]";
  }
  return compress(tag, max);
}

function buildLine(
  indent: string,
  type: string,
  tag: string | undefined,
  maxLength: number,
): string {
  const tagStr = tag ? " " + tag : "";
  const full = indent + type + tagStr;
  if (full.length <= maxLength) return full;

  if (!tag) {
    return indent + compress(type, maxLength - indent.length);
  }

  // Try compressing type while keeping tag intact
  const availForType = maxLength - indent.length - 1 - tag.length;
  if (availForType >= MIN_TYPE) {
    return indent + compress(type, availForType) + " " + tag;
  }

  // Type at minimum; try <N< marker to save indent space
  const compType = compress(type, MIN_TYPE);
  if (indent.length > 4) {
    const N = indent.length - 4;
    const marker = `«${N}« ` + compType + " " + tag;
    if (marker.length <= maxLength) return marker;
  }

  // Compress tag too (type at MIN_TYPE, normal indent)
  const availForTag = maxLength - indent.length - 1 - MIN_TYPE;
  if (availForTag >= 3) {
    return indent + compType + " " + compressTag(tag, availForTag);
  }

  // Compress type+tag together within available space
  const available = maxLength - indent.length;
  if (available > 0) {
    return indent + compress(type + " " + tag, available);
  }
  return compress(type + " " + tag, maxLength);
}

function contentInline(content: string[]): string {
  return "(" + content.map((s) => `"${s}"`).join(" ") + ")";
}

function renderContent(
  firstLine: string,
  content: string[],
  maxLength: number,
): string[] {
  const inline = contentInline(content);
  if (firstLine.length + 1 + inline.length <= maxLength) {
    return [firstLine + " " + inline];
  }
  const lines = [firstLine];
  const indent = firstLine.match(/^( *)/)?.[1] ?? "";
  const chunkSize = maxLength - 1;
  const text = content.join('" "');
  let pos = 0;
  while (pos < text.length) {
    const chunk = text.slice(pos, pos + chunkSize);
    const isLast = pos + chunkSize >= text.length;
    lines.push(indent + '"' + chunk + (isLast ? '"' : ""));
    pos += chunkSize;
  }
  return lines;
}

function hasRenderableChildren(depth: number): (node: LayoutNode) => boolean {
  return (node: LayoutNode) => {
    if (!node.children?.length) return false;
    if (depth === 0) return true;
    let cur: LayoutNode = node;
    while (isChainable(cur)) cur = cur.children![0];
    return (cur.children ?? []).some(hasRenderableChildren(depth - 1));
  };
}

function isChainable(node: LayoutNode): boolean {
  return !node.tag && !node.content?.length && node.children?.length === 1;
}

function renderChain(
  node: LayoutNode,
  indent: string,
  maxLength: number,
): string[] {
  const types: string[] = [node.type];
  let cur = node.children![0];
  while (isChainable(cur)) {
    types.push(cur.type);
    cur = cur.children![0];
  }
  types.push(cur.type);

  const chainStr = types.join(" ▶ ");
  const tagStr = cur.tag ? " " + cur.tag : "";

  const firstLinePart = indent + chainStr + tagStr;
  const firstLines = cur.content?.length
    ? renderContent(firstLinePart, cur.content, maxLength)
    : [firstLinePart];
  return [...firstLines, ...renderChildren(cur, indent, maxLength)];
}

function shouldUseGuides(node: LayoutNode): boolean {
  const allExceptLast = (node.children ?? []).slice(0, -1);
  return !!allExceptLast.filter(hasRenderableChildren(1)).length;
}

function renderChildren(
  node: LayoutNode,
  indent: string,
  maxLength: number,
): string[] {
  const children = node.children ?? [];
  if (children.length === 0) return [];

  const childIndent = indent + "  ";
  const useGuides = shouldUseGuides(node);

  if (!useGuides) {
    return children.flatMap((child) =>
      renderNode(child, childIndent, maxLength),
    );
  }

  const lines: string[] = [];
  const lastChild = children[children.length - 1];

  for (const child of children) {
    const isLast = child === lastChild;
    const childLines = renderNode(child, childIndent, maxLength);
    const guidedFirst =
      indent + (isLast ? "└ " : "├ ") + childLines[0].slice(childIndent.length);

    if (isLast) {
      lines.push(guidedFirst, ...childLines.slice(1));
    } else {
      const processed = [guidedFirst];
      for (let i = 1; i < childLines.length; i++) {
        const line = childLines[i];
        if (line.slice(indent.length, indent.length + 2) === "  ") {
          processed.push(
            line.slice(0, indent.length) + "│ " + line.slice(indent.length + 2),
          );
        } else {
          processed.push(line);
        }
      }
      lines.push(...processed);
    }
  }

  return lines;
}

function renderNode(
  node: LayoutNode,
  indent: string,
  maxLength: number,
): string[] {
  if (isChainable(node)) {
    return renderChain(node, indent, maxLength);
  }

  const firstLine = buildLine(indent, node.type, node.tag, maxLength);

  if (node.content?.length) {
    return [
      ...renderContent(firstLine, node.content, maxLength),
      ...renderChildren(node, indent, maxLength),
    ];
  }

  return [firstLine, ...renderChildren(node, indent, maxLength)];
}
