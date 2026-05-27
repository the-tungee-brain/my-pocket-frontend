export const OPEN_CHAT_EVENT = "tomcrest:open-chat";
export const ASSISTANT_CHAT_INPUT_CLASS = "assistant-chat-input";

function focusVisibleAssistantInput() {
  const inputs = document.querySelectorAll<HTMLTextAreaElement>(
    `textarea.${ASSISTANT_CHAT_INPUT_CLASS}`,
  );

  for (const input of inputs) {
    const { width, height } = input.getBoundingClientRect();
    if (width > 0 && height > 0 && !input.disabled) {
      input.focus({ preventScroll: true });
      return true;
    }
  }

  return false;
}

export function scrollToChat() {
  if (typeof window === "undefined") return;

  window.dispatchEvent(new CustomEvent(OPEN_CHAT_EVENT));

  const scrollConversation = () => {
    document
      .getElementById("assistant-chat")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const focusInputWithRetries = () => {
    if (focusVisibleAssistantInput()) return;

    window.setTimeout(() => {
      if (focusVisibleAssistantInput()) return;
      window.setTimeout(focusVisibleAssistantInput, 200);
    }, 50);
  };

  window.requestAnimationFrame(() => {
    scrollConversation();
    focusInputWithRetries();
  });
}

export const scrollToAssistantChat = scrollToChat;
