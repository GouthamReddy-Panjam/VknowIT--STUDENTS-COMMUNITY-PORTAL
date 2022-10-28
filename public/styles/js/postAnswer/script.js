function openNav() {
    document.getElementById("mySidenav").style.width = "250px";

  }

  function closeNav() {
    document.getElementById("mySidenav").style.width = "0";

  }

  ClassicEditor.create(document.querySelector("#editor"));

  document.querySelector("form").addEventListener("submit", (e) => {
    e.preventDefault();
    console.log(document.getElementById("editor").value);
  });
