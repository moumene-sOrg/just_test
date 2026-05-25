let conversations = document.querySelectorAll(".conversation") ;

conversations.forEach(conv => { conv.addEventListener("click" , function(){
    window.open("./discussionMobile.html" , "_self")
})})