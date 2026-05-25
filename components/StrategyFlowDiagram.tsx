"use client";

import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
} from "lucide-react";
import type { StrategyFlowDefinition, StrategyFlowNode } from "@/lib/strategyFlows";
import { cn } from "@/lib/utils";

type Props = {
  flow: StrategyFlowDefinition;
  className?: string;
};

type PlacedNode = {
  node: StrategyFlowNode;
  index: number;
};

type FlowRow =
  | { kind: "pair"; direction: "ltr" | "rtl"; nodes: [PlacedNode, PlacedNode] }
  | { kind: "single"; node: PlacedNode };

function buildSerpentineRows(nodes: StrategyFlowNode[]): FlowRow[] {
  const rows: FlowRow[] = [];
  let index = 0;
  let rowNum = 0;

  while (index < nodes.length) {
    const remaining = nodes.length - index;

    if (remaining === 1) {
      rows.push({
        kind: "single",
        node: { node: nodes[index], index },
      });
      break;
    }

    const direction = rowNum % 2 === 0 ? "ltr" : "rtl";
    rows.push({
      kind: "pair",
      direction,
      nodes: [
        { node: nodes[index], index },
        { node: nodes[index + 1], index: index + 1 },
      ],
    });

    index += 2;
    rowNum += 1;
  }

  return rows;
}

/** Even-length serpentine flows start and end in the left column. */
function hasLeftColumnLoop(nodes: StrategyFlowNode[]) {
  return nodes.length >= 2 && nodes.length % 2 === 0;
}

export function StrategyFlowDiagram({ flow, className }: Props) {
  const rows = buildSerpentineRows(flow.nodes);
  const showLoop = flow.repeats && hasLeftColumnLoop(flow.nodes);

  return (
    <div className={cn("w-full", className)}>
      <div className="space-y-1">
        {rows.map((row, rowIndex) => (
          <div key={`row-${rowIndex}`}>
            {row.kind === "pair" ? (
              <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-stretch gap-2">
                {row.direction === "ltr" ? (
                  <>
                    <FlowNodeCard {...row.nodes[0]} />
                    <FlowArrowHorizontal direction="right" />
                    <FlowNodeCard {...row.nodes[1]} />
                  </>
                ) : (
                  <>
                    <FlowNodeCard {...row.nodes[1]} />
                    <FlowArrowHorizontal direction="left" />
                    <FlowNodeCard {...row.nodes[0]} />
                  </>
                )}
              </div>
            ) : (
              <div className="flex justify-center px-6">
                <div className="w-full max-w-[15rem]">
                  <FlowNodeCard {...row.node} />
                </div>
              </div>
            )}

            {rowIndex < rows.length - 1 &&
              (showLoop && rowIndex === 0 ? (
                <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] py-1">
                  <FlowArrowVertical direction="up" inline />
                  <div />
                  <FlowArrowVertical direction="down" inline />
                </div>
              ) : (
                <FlowArrowVertical
                  direction="down"
                  align={getDownArrowAlign(row, rows[rowIndex + 1])}
                />
              ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function getDownArrowAlign(
  currentRow: FlowRow,
  nextRow: FlowRow,
): "left" | "right" | "center" {
  if (currentRow.kind === "single") return "center";

  if (currentRow.direction === "ltr") {
    return "right";
  }

  return nextRow.kind === "single" ? "center" : "left";
}

function FlowNodeCard({ node, index }: PlacedNode) {
  return (
    <div className="h-full rounded-xl border border-border bg-background/70 px-3 py-2.5 shadow-sm">
      <div className="flex items-start gap-2">
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-accent/30 bg-accent-muted/60 text-[10px] font-semibold text-accent-strong">
          {index + 1}
        </span>
        <div className="min-w-0">
          <p className="text-xs font-semibold leading-snug text-foreground">
            {node.title}
          </p>
          <p className="mt-1 text-[11px] leading-relaxed text-muted">
            {node.caption}
          </p>
        </div>
      </div>
    </div>
  );
}

function FlowArrowHorizontal({
  direction,
}: {
  direction: "left" | "right";
}) {
  const Icon = direction === "right" ? ArrowRight : ArrowLeft;

  return (
    <div className="flex items-center justify-center self-center px-0.5 text-muted">
      <Icon className="h-4 w-4" aria-hidden />
    </div>
  );
}

function FlowArrowVertical({
  direction,
  align,
  inline = false,
}: {
  direction: "down" | "up";
  align?: "left" | "right" | "center";
  inline?: boolean;
}) {
  const Icon = direction === "down" ? ArrowDown : ArrowUp;

  return (
    <div
      className={cn(
        "flex py-1",
        inline
          ? "justify-center"
          : align === "left" && "justify-start pl-[calc(25%-0.5rem)]",
        !inline && align === "right" && "justify-end pr-[calc(25%-0.5rem)]",
        !inline && align === "center" && "justify-center",
      )}
    >
      <div className="flex flex-col items-center text-muted" aria-hidden>
        <Icon className="h-4 w-4" />
      </div>
    </div>
  );
}
