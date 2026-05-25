export function scrollToChat() {
  window.requestAnimationFrame(() => {
    document
      .getElementById("assistant-chat")
      ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  });
}

export const scrollToAssistantChat = scrollToChat;
