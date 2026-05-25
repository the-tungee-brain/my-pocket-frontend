export function scrollToAssistantChat(behavior: ScrollBehavior = "smooth") {
  if (typeof window === "undefined") return;

  window.requestAnimationFrame(() => {
    const target = document.getElementById("assistant-chat");
    target?.scrollIntoView({ behavior, block: "start" });
  });
}
