export const OPEN_CHAT_EVENT = "tomcrest:open-chat";

export function scrollToChat() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(OPEN_CHAT_EVENT));
  }

  window.requestAnimationFrame(() => {
    document
      .getElementById("assistant-chat")
      ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  });
}

export const scrollToAssistantChat = scrollToChat;
