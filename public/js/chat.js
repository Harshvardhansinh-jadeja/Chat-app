const socket = io();

//elements
const messageForm = document.querySelector("#message-form");
const messageFormInput = messageForm.querySelector("input");
const messageFormButton = messageForm.querySelector("button");
const SendLocation = document.getElementById("send-location");
const messages = document.getElementById("messages");

//Templates
const messageTemplate = document.getElementById("messageTemplate").innerHTML;
const locationTemplate = document.getElementById("locationTemplate").innerHTML;
const sidebarTemplate = document.getElementById("sidebar-template").innerHTML;

//Options
const {username, room} = Qs.parse(location.search, {ignoreQueryPrefix: true});

const autoscroll = () => {
  const newMessages = messages.lastElementChild;

  const newMessagesStyle = getComputedStyle(newMessages);
  const newMessagesMargin = parseInt(newMessagesStyle.marginBottom);
  const newMessagesHeight = newMessages.offsetHeight + newMessagesMargin;

  //Visible Height
  const visibleHeight = messages.offsetHeight;

  //scroll Height
  const containerHeight = messages.scrollHeight;

  //How far have i scrolled
  const scrollOffset = messages.scrollTop + visibleHeight;

  if (containerHeight - newMessagesHeight <= scrollOffset) {
    messages.scrollTop = messages.scrollHeight;
  }
};

socket.on("message", (message) => {
  console.log(message);
  const html = Mustache.render(messageTemplate, {
    username: message.username,
    message: message.text,
    createdAt: moment(message.createdAt).format("h:mm a"),
  });
  messages.insertAdjacentHTML("beforeend", html);
  autoscroll();
});

socket.on("locationMessage", (message) => {
  console.log(message);
  const html = Mustache.render(locationTemplate, {
    username: message.username,
    url: message.url,
    createdAt: moment(message.createdAt).format("h:mm a"),
  });
  messages.insertAdjacentHTML("beforeend", html);
  autoscroll();
});

socket.on("roomData", ({room, users}) => {
  const html = Mustache.render(sidebarTemplate, {
    room,
    users,
  });
  document.getElementById("sidebar").innerHTML = html;
});

messageForm.addEventListener("submit", (e) => {
  e.preventDefault();
  //Disabling button just for the time being while message being send
  messageFormButton.setAttribute("disabled", "disabled");

  // const message = document.querySelector('input').value
  //When we want to target which is inside another tag then we use e.target with it's name...here it is inside form tag.
  const message = e.target.elements.message.value;
  socket.emit("sendMessage", message, (error) => {
    //Enabling button afer sending message and clear the input and focus cursor
    messageFormButton.removeAttribute("disabled");
    messageFormInput.value = "";
    messageFormInput.focus();
    if (error) {
      return console.log(error);
    }
    console.log("message delievered");
  });
});

SendLocation.addEventListener("click", () => {
  if (!navigator.geolocation) {
    return alert("Your browser does not support geo location.");
  }
  SendLocation.setAttribute("disabled", "disabled");
  navigator.geolocation.getCurrentPosition((position) => {
    // console.log(position)
    socket.emit(
      "sendLocation",
      {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      },
      () => {
        SendLocation.removeAttribute("disabled");
        console.log("Location Shared");
      }
    );
  });
});

socket.emit("join", {username, room}, (error) => {
  if (error) {
    alert(error);
    location.href = "/";
  }
});
