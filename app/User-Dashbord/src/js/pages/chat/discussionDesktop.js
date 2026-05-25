
let inputMessage = document.querySelector(".send-message") ;
let sendBtn = document.querySelector('[aria-label="Send message"]') ;
let sendTime = null ;
document.forms[0].addEventListener("submit" , function(event){
    event.preventDefault() ;
    if (inputMessage.value === "") return ;
    sendMessage(inputMessage.value) ;
    inputMessage.value = "" ;
    inputMessage.blur() ;
    // document.querySelector("main").scrollTo({top:1000 , behavior:"smooth"})
}) ;

function sendMessage(text){
    let messageBox = document.createElement("div") ;
    let currentTime = new Date() ;
    let isSameTime = sendTime ? (sendTime.hour === currentTime.getHours() && sendTime.min === currentTime.getMinutes())? true : false :false ;
    messageBox.className = `${isSameTime ? "-mt-5" :""} sender flex flex-col items-end gap-1` ;
    messageBox.innerHTML = `${isSameTime ? "" :`<span class="text-[12px] text-gray-400 mr-12">You • ${currentTime.getHours()}:${currentTime.getMinutes()} ${currentTime.getHours() >= 12 ? "PM" : "AM"}</span>` }
    <div class="flex items-end gap-2 max-w-[85%] justify-end">
    <div class="bg-blue-600 text-white p-4 rounded-2xl rounded-br-none text-[15px] leading-relaxed">
    ${text}                    </div>
<div class="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
<img alt="You" class="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDrky5997Eo29MNA_iwyvvpUdom7YcP_0dnqsJljWlpbBdmKPDJm5fJichiN8Nc8MIzJy_c4GVmxJCdnhIIVmP_joh7zPqFoEQ6geRKet_1YrKIl5tJ6J2NbF9noPMozu4_ckjtVs-sYCXIKRbX5FKdcTkz1QbWWiSCGsM_vJrKwZ38gX79RiPCO-u9qn_KHjzjKgttnlBC_Rq_6GIg5SFrX_wWNiKrblZJhxhU9ojqknQPTTS573Jlibk8xyTYDYoqb8JLlH0hRbs"/>
</div>
</div>` ;
sendTime = {hour:currentTime.getHours() , min : currentTime.getMinutes()} ;
    document.querySelectorAll(".conversation-box").forEach(convBox => convBox.appendChild(messageBox)) ;
    messageBox.scrollIntoView({behavior:"smooth"});
}

let pages = document.querySelectorAll(".aside-bar > *") ;

pages.forEach(page => {
  page.addEventListener("click",function(){
    pages.forEach(page => page.classList.remove("active-page-aside")) ;
    page.classList.add("active-page-aside") ;
  })
})