const sign_in_btn = document.querySelector("#sign-in-btn");
const sign_up_btn = document.querySelector("#sign-up-btn");
const container = document.querySelector(".container");

sign_up_btn.addEventListener("click", () => {
  container.classList.add("sign-up-mode");
});

sign_in_btn.addEventListener("click", () => {
  container.classList.remove("sign-up-mode");
});

var state = false;

function toggle() {
  if (state) {
    console.log("type password");
    document.getElementById("passwordLogIn").setAttribute("type", "password");
    document.getElementById("passwordSignUp").setAttribute("type", "password");
    const abc = document.getElementById("eyeToggleLogIn")
    abc.className = "fas fa-eye-slash eye";
    const xyz = document.getElementById("eyeToggleSignUp")
    xyz.className = "fas fa-eye-slash eye";
    state = false;
  } else {
    console.log("type text");
    document.getElementById("passwordLogIn").setAttribute("type", "text");
    document.getElementById("passwordSignUp").setAttribute("type", "text");
    const abc = document.getElementById("eyeToggleLogIn")
    abc.className = "fas fa-eye eye";
    const xyz = document.getElementById("eyeToggleSignUp")
    xyz.className = "fas fa-eye eye";
    state = true;
  }
}

document.getElementById("otp-input").disabled = true;

function toggle2() {
  document.getElementById("otp-input").disabled = false;
  document.getElementById("otp-input").style.backgroundColor = "#fff";
}
