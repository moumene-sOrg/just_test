

document.querySelector(".edit").addEventListener("click",function(){
    let inputs = document.querySelectorAll("input") ;
    inputs.forEach(input => input.disabled = false) ;
    inputs[0].focus() ;
})

document.querySelector(".save").addEventListener("click",function(){
     let inputs = document.querySelectorAll("input") ;
     inputs.forEach(input => input.disabled = true) ;
})