const chat = document.getElementById("chat");
const form = document.getElementById("chatForm");
const input = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");
const typing = document.getElementById("typing");
const clearBtn = document.getElementById("clearBtn");

function showWelcome() {
  chat.innerHTML = `
    <section class="welcome">
      <div class="welcome-logo">N</div>

      <h2>Welcome to NEXA</h2>

      <p>
        Your AI image generator. Enter a description to create visual art.
      </p>

      <div class="suggestions">
        <button data-prompt="A futuristic cyberpunk city at night with neon lights">
          Cyberpunk City
        </button>

        <button data-prompt="An anime warrior standing in a cherry blossom forest">
          Anime Warrior
        </button>

        <button data-prompt="A cute mech robot operating a coffee shop">
          Coffee Mech
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

function addMessage(role, content, isImage = false) {
  removeWelcome();

  const row = document.createElement("div");
  row.className = `message-row ${role}`;

  const message = document.createElement("div");
  message.className = `message ${role}`;

  if (isImage) {
    const img = document.createElement("img");
    img.src = content;
    img.alt = "Generated AI Art";
    img.style.maxWidth = "100%";
    img.style.borderRadius = "10px";
    img.style.display = "block";
    message.appendChild(img);
  } else {
    message.textContent = content;
  }

  row.appendChild(message);
  chat.appendChild(row);

  chat.scrollTop = chat.scrollHeight;
}

function setLoading(isLoading) {
  if (typing) {
    typing.textContent = "NEXA is generating artwork...";
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

  addMessage("user", text);

  input.value = "";
  input.style.height = "auto";

  setLoading(true);

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ message: text })
    });

    let data;
    try {
      data = await response.json();
    } catch {
      throw new Error(
        `Server returned an invalid response (${response.status}).`
      );
    }

    if (!response.ok) {
      throw new Error(
        data?.error || `Request failed with status ${response.status}.`
      );
    }

    if (data.imageUrl) {
      addMessage("assistant", data.imageUrl, true);
    } else {
      addMessage("assistant", "No image URL returned from server.");
    }

  } catch (error) {
    console.error("NEXA error:", error);
    addMessage(
      "assistant",
      "NEXA ERROR:\n" + (error.message || "Unknown error")
    );
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
  input.style.height = Math.min(input.scrollHeight, 150) + "px";
});

input.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    form.requestSubmit();
  }
});

clearBtn.addEventListener("click", () => {
  showWelcome();
  input.value = "";
  input.style.height = "auto";
  input.focus();
});

function attachSuggestionButtons() {
  document.querySelectorAll("[data-prompt]").forEach((button) => {
    button.addEventListener("click", () => {
      sendMessage(button.dataset.prompt);
    });
  });
}

showWelcome();
