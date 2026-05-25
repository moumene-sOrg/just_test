const deskItems = document.querySelectorAll("aside.desk ul li");
const mobItems = document.querySelectorAll("aside.mob ul li");

function setActive(index) {
  deskItems.forEach(el => el.classList.remove("active"));
  mobItems.forEach(el => el.classList.remove("active"));

  deskItems[index].classList.add("active");
  mobItems[index].classList.add("active");
}

deskItems.forEach(function (item, index) {
  item.addEventListener("click", function () {
    setActive(index);
  });
});

mobItems.forEach(function (item, index) {
  item.addEventListener("click", function () {
    setActive(index);
  });
});

const buttons = document.querySelectorAll(".cases-section button");

buttons.forEach((button) => {
  button.addEventListener("click", function () {

    buttons.forEach((btn) => btn.classList.remove("active"));
    this.classList.add("active");

  });
});

//-----unchecked radio  buttons--------
document.querySelectorAll('input[type="radio"]').forEach(radio => {
  radio.addEventListener('click', function () {
    if (this.dataset.checked === "true") {
      this.checked = false;
      this.dataset.checked = "false";
    } else {
      document.querySelectorAll('input[name="' + this.name + '"]').forEach(r => {
        r.dataset.checked = "false";
      });
      this.dataset.checked = "true";
    }
  });
});

