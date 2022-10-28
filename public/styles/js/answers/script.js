function openNav() {
  document.getElementById("mySidenav").style.width = "250px";

}

function closeNav() {
  document.getElementById("mySidenav").style.width = "0";

}

var likeIcon =document.getElementById("like"),
    likeCounter= document.getElementById("likeCount"),
    dislikeIcon=document.getElementById("dislike"),
    dislikeCounter= document.getElementById("dislikeCount"),
    loveIcon= document.getElementById("love"),
    loveCounter=document.getElementById("loveCounter");


  likeIcon.addEventListener("click", function(){

  this.classList.toggle("like");
  //classList is useful to add, remove or toggle css classes on an html element

  var noOfLikes= Number(likeCounter.textContent);
  if(this.classList.contains("like")){
    noOfLikes++;  likeCounter.textContent= noOfLikes;
  }

  else{
    noOfLikes--;
    likeCounter.textContent= noOfLikes;
  }
});

dislikeIcon.addEventListener("click", function(){
  this.classList.toggle("dislike");

  var noOfDislikes= Number(dislikeCounter.textContent);
  if(this.classList.contains("dislike")){
    noOfDislikes++; dislikeCounter.textContent= noOfDislikes;
  }

  else{
    noOfDislikes--; dislikeCounter.textContent= noOfDislikes;
  }

})
