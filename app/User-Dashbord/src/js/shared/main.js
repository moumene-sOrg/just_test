

const selectsResut = document.querySelectorAll(".select-box .result");
const options = document.querySelectorAll(".options");

selectsResut.forEach(function (selectResut) {
  selectResut.addEventListener("click", function () {
    selectResut.nextElementSibling.classList.remove("hidden");
  });
});

options.forEach(function (optsbox) {
  optsbox.addEventListener("mouseleave", function () {
    optsbox.classList.add("hidden");
  });
});

const selectOptions = document.querySelectorAll(".select-box .options .option");

selectOptions.forEach(function (opt) {
  opt.addEventListener("click", function () {
    opt.parentElement.previousElementSibling.innerHTML = opt.innerHTML;
  });
});
let pages = document.querySelectorAll(".main-aside ul li") ;

pages.forEach(page => {
  page.addEventListener("click",function(){
    pages.forEach(page => page.classList.remove("active-page-aside")) ;
    page.classList.add("active-page-aside") ;
  })
})

import { addDemand, getDemands, getProfile, getReportNumber, getApprovedNumber } from "./api.js";

window.addDemand = addDemand;
window.getDemands = getDemands;
window.getProfile = getProfile;
window.getReportNumber = getReportNumber;
window.getApprovedNumber = getApprovedNumber;
