function openNav() {
  document.getElementById("mySidenav").style.width = "250px";

}

function closeNav() {
  document.getElementById("mySidenav").style.width = "0";

}

// orange navbar
function myFunction() {
  var x = document.getElementById("topnavbar");
  if (x.className === "navbar") {
    x.className += " responsive";
  } else {
    x.className = "navbar";
  }
}

var showResults = debounce(function(arg) {
  var value = arg.trim();
  if (value === "" || value.length <= 0) {
    $("#search-results").fadeOut();
    return;
  } else {
    $("#search-results").fadeIn();
  };
  var jqxhr = $.get("/xhr/search?q=" + value, function(data) {
      $("#search-results").html("");
    })
    .done(function(data) {
      if (data.length === 0) {
        $("#search-results").append("<p>No Results</p>");
      } else {
        data.forEach(x => {
          $("#search-results").append("<a href='#'></a>")
        });
      }
    })
    .fail(function(err) {
      console.log(err);
    });
}, 200);

function debounce(func, wait, immediate) {
  var timeout;
  return function() {
    var context = this,
      args = arguments;
    var later = function() {
      timeout = null;
      if (!immediate) func.apply(context, args);
    };
    var callnow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callnow) func.apply(context, agrs);
  };
};
