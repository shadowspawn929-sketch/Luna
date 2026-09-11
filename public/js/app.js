const chat = document.getElementById("chat");
const form = document.getElementById("chatForm");
const input = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");
const typing = document.getElementById("typing");
const clearBtn = document.getElementById("clearBtn");

let conversation = [];

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

function setLoading(value) {
  typing.style.display = value ? "block" : "none";
  sendBtn.disabled = value;
  input.disabled = value;
}

async function sendMessage(text) {

  text = text.trim();

  if (!text) {
    return;
  }

  addMessage("user", text);

  const previousConversation = [...conversation];

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

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Request failed.");
    }

    const reply = data.reply || "I couldn't generate a response.";

    addMessage("assistant", reply);

    conversation.push({
      role: "assistant",
      content: reply
    });

  } catch (error) {

    console.error(error);

    addMessage(
      "assistant",
      "Sorry, I couldn't connect to the AI server. Check your Render environment variables and logs."
    );

    conversation = previousConversation;

  } finally {

    setLoading(false);
    input.focus();

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

});

function attachSuggestionButtons() {

  document
    .querySelectorAll("[data-prompt]")
    .forEach(button => {

      button.addEventListener("click", () => {

        sendMessage(button.dataset.prompt);

      });

    });

}

attachSuggestionButtons();
