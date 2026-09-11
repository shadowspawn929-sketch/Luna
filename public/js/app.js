const chat = document.getElementById("chat");
const form = document.getElementById("chatForm");
const input = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");
const typing = document.getElementById("typing");
const clearBtn = document.getElementById("clearBtn");

let conversation = [];

function showWelcome() {
  chat.innerHTML = `
    <section class="welcome">
      <div class="welcome-logo">N</div>

      <h2>Welcome to NEXA</h2>

      <p>
        Your AI assistant for questions, ideas, learning,
        writing and everyday tasks.
      </p>

      <div class="suggestions">
        <button data-prompt="Explain something interesting to me.">
          Explain something
        </button>

        <button data-prompt="Help me learn something new today.">
          Teach me
        </button>

        <button data-prompt="Give me some creative ideas.">
          Creative ideas
        </button>
      </div>
    </section>
  `;

  attachSuggestionButtons();
}

function removeWelcome() {
  const welcome = document.querySelector(".welcome");

  if (welcome) {
    welcome.remove();
  }
}

function addMessage(role, text) {
  removeWelcome();

  const row = document.createElement("div");
  row.className = `message-row ${role}`;

  const message = document.createElement("div");
  message.className = `message ${role}`;

  message.textContent = text;

  row.appendChild(message);
  chat.appendChild(row);

  chat.scrollTop = chat.scrollHeight;
}

function setLoading(isLoading) {
  if (typing) {
    typing.style.display = isLoading ? "block" : "none";
  }

  if (sendBtn) {
    sendBtn.disabled = isLoading;
  }

  if (input) {
    input.disabled = isLoading;
  }
}

async function sendMessage(text) {
  text = text.trim();

  if (!text) {
    return;
  }

  // Save the conversation before adding the new message.
  const previousConversation = [...conversation];

  addMessage("user", text);

  conversation.push({
    role: "user",
    content: text
  });

  input.value = "";
  input.style.height = "auto";

  setLoading(true);

  try {
    const response = await fetch("/api/chat", {
      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        message: text,
        history: previousConversation
      })
    });

    // Try to read JSON safely.
    let data;

    try {
      data = await response.json();
    } catch {
      throw new Error(
        `Server returned an invalid response (${response.status}).`
      );
    }

    // Show the REAL server/API error.
    if (!response.ok) {
      throw new Error(
        data?.error ||
        `Request failed with status ${response.status}.`
      );
    }

    const reply =
      data?.reply ||
      "NEXA received the request but returned no response.";

    addMessage("assistant", reply);

    conversation.push({
      role: "assistant",
      content: reply
    });

  } catch (error) {
    console.error("NEXA chat error:", error);

    addMessage(
      "assistant",
      "NEXA ERROR:\n" +
      (error.message || "Unknown error")
    );

    // Remove the failed user message from conversation history.
    conversation = previousConversation;

  } finally {
    setLoading(false);

    if (input) {
      input.focus();
    }
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  await sendMessage(input.value);
});

input.addEventListener("input", () => {
  input.style.height = "auto";

  input.style.height =
    Math.min(input.scrollHeight, 150) + "px";
});

input.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();

    form.requestSubmit();
  }
});

clearBtn.addEventListener("click", () => {
  conversation = [];

  showWelcome();

  input.value = "";
  input.style.height = "auto";
  input.focus();
});

function attachSuggestionButtons() {
  document
    .querySelectorAll("[data-prompt]")
    .forEach((button) => {
      button.addEventListener("click", () => {
        sendMessage(button.dataset.prompt);
      });
    });
}

// Start NEXA.
showWelcome();
