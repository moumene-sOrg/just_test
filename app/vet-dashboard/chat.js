const socket = io(window.location.origin);
// const socket = io("http://localhost:8080");
// const socket = io("https://evaluator-unknown-marauding.ngrok-free.dev", {
//   extraHeaders: {
//     "ngrok-skip-browser-warning": "true",
//   },
// });

let selectedClient = null;

let availableUsers = {};

const conversations = {};

disableTyping();

// Adding new user
const username = prompt("Choose your name:");
socket.emit("new-user", username);

// Users list
socket.on("refresh-users", (users) => {
  console.log("USER CONNECTED");

  availableUsers = users;
  const people = document.querySelector(".people");

  people.innerHTML = "";

  for (let id in availableUsers) {
    if (id === socket.id) continue;

    const div = document.createElement("div");
    div.className = "person";

    div.innerHTML = `
        <img 
            id="user-img"
            src="./images/msg-profile-test.png"
            alt=""
        />
        <div id="user-info">
            <span id="name">${users[id]}</span> 
            <p id="last-msg">No message yet</p> 
        </div>
        <span id="time">12:59</span>
    `;

    div.onclick = () => {
      selectedClient = id;
      document
        .querySelectorAll(".person")
        .forEach((p) => p.classList.remove("active"));

      div.classList.add("active");

      updateChatHeader(users[id], id);
      loadConversation(id);
      enableTyping();
    };

    people.appendChild(div);
  }
});

// Send message
let form = document.getElementById("chat-form");

form.addEventListener("submit", (e) => {
  e.preventDefault();

  console.log("Form submitted!");

  const input = document.querySelector(".message-input");

  console.log("Input found:", input);
  console.log("Input value:", input?.value);
  console.log("Selected client:", selectedClient);

  const text = input.value.trim();

  if (!text || !selectedClient) return;

  const data = { id: socket.id, username, message: text };

  // Store in local conversation history
  if (!conversations[selectedClient]) conversations[selectedClient] = [];
  conversations[selectedClient].push(data);

  // Show immediately for sender
  appendMessage(data, true);

  // Emit to server
  socket.emit("send-message", { message: text, to: selectedClient });

  input.value = "";
});

// receive message
socket.on("receive-message", (data) => {
  const peerId = data.id;

  // Store in conversation history
  if (!conversations[peerId]) conversations[peerId] = [];
  conversations[peerId].push(data);

  if (selectedClient === peerId) {
    appendMessage(data, false);
  }
});

// Helper functions
// ====================
// Show the selected user
function updateChatHeader(user = null, userId = null) {
  let conversationHeader = document.querySelector(".conver-head");
  conversationHeader.innerHTML = "";

  if (!user) {
    conversationHeader.textContent = "No Conversations Selected";
    return;
  }
  let image = document.createElement("img");
  image.id = "user-img";
  image.src = "./images/msg-profile-test.png";

  let div = document.createElement("div");
  div.id = "user-info";

  let span = document.createElement("span");
  span.id = "name";
  span.textContent = user;

  let p = document.createElement("p");
  p.id = "state";
  p.textContent = "Online";

  div.appendChild(span);
  div.appendChild(p);

  conversationHeader.appendChild(image);
  conversationHeader.appendChild(div);
}

function appendMessage(data, isSent, scroll = true) {
  const element = document.createElement("div");
  element.className = isSent ? "msg sent" : "msg received";

  element.textContent = data.message;

  const container = document.querySelector(".conversation");
  container.appendChild(element);

  if (scroll) container.scrollTop = container.scrollHeight;
}

function loadConversation(userId) {
  const container = document.querySelector(".conversation");
  container.innerHTML = "";

  if (!conversations[userId]) return;

  conversations[userId].forEach((data) => {
    const isSent = data.id === socket.id;
    appendMessage(data, isSent, false); // false = don't auto-scroll each message
  });

  // scroll to bottom once after all messages are loaded
  container.scrollTop = container.scrollHeight;
}

// Prevent sending when no conversation is selected
function enableTyping() {
  document.querySelector(".conver-typing").classList.remove("disabled");
}

function disableTyping() {
  document.querySelector(".conver-typing").classList.add("disabled");
}
// ====================

// Start Add Files or Photos
let addFiles = document.querySelector("label.add-files");
let attachement = document.querySelector(".conver-typing .box i#att");

attachement.onclick = (e) => {
  e.stopPropagation();
  addFiles.classList.toggle("hide");
};

document.addEventListener("click", function (e) {
  if (!addFiles.contains(e.target) && !attachement.contains(e.target)) {
    addFiles.classList.add("hide");
  }
});
// End Add Files
// Start Mobile View
(() => {
  const main = document.querySelector(".main");
  const msgBox = document.querySelector(".msg-box");
  const head = document.querySelector(".conver-head");

  const backBtn = document.createElement("button");
  backBtn.className = "back-btn";
  backBtn.setAttribute("aria-label", "Back to conversations");
  backBtn.innerHTML = '<i class="fa-solid fa-arrow-left"></i>';
  head.insertBefore(backBtn, head.firstChild); // prepend

  document.querySelectorAll(".people .person").forEach(function (person) {
    person.addEventListener("click", () => {
      document.querySelectorAll(".people .person").forEach(function (p) {
        p.classList.remove("active");
      });
      person.classList.add("active");

      main.classList.add("chat-open");
    });
  });

  backBtn.addEventListener("click", function () {
    main.classList.remove("chat-open");
  });
})();
// End Mobile view
