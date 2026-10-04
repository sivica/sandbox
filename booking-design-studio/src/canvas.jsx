import React, { useMemo } from "react";
import { ReactFlow, Background, Controls } from "@xyflow/react";
import { screens, screenHTML } from "./design.js";
function ScreenNode({ data }) {
  return (
    <section className={"canvas-screen " + (data.active ? "is-selected" : "")}>
      <strong>{data.label}</strong>
      <iframe
        sandbox=""
        tabIndex={-1}
        title={data.label + " canvas design"}
        srcDoc={screenHTML(
          data.design,
          data.index,
          data.active ? data.element : null,
        )}
      />
      <div className="nodrag canvas-node-actions">
        <button
          aria-label={"Select " + data.label + " heading"}
          onClick={() => data.select(data.index, "title")}
        >
          Heading
        </button>
        <button
          aria-label={"Select " + data.label + " subtitle"}
          onClick={() => data.select(data.index, "subtitle")}
        >
          Subtitle
        </button>
        <button
          aria-label={"Select " + data.label + " button"}
          onClick={() => data.select(data.index, "action")}
        >
          Button
        </button>
      </div>
    </section>
  );
}
const nodeTypes = { screen: ScreenNode };
export function DesignCanvas({
  version,
  layout = {},
  onLayout,
  onSelect,
  selectedScreen,
  element,
}) {
  const nodes = useMemo(
    () =>
      screens.map((label, i) => ({
        id: String(i),
        type: "screen",
        position: layout[i] || { x: i * 350, y: 0 },
        data: {
          label,
          index: i,
          design: version.design,
          active: selectedScreen === i,
          element,
          select: onSelect,
        },
      })),
    [version, layout, selectedScreen, element, onSelect],
  );
  return (
    <section className="design-canvas" aria-label="Design canvas">
      <ReactFlow
        nodes={nodes}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.2}
        maxZoom={1.4}
        nodesConnectable={false}
        panOnScroll
        onNodeDragStop={(_, node) =>
          onLayout({ ...layout, [node.id]: node.position })
        }
      >
        <Background />
        <Controls showInteractive={false} />
      </ReactFlow>
    </section>
  );
}
