let resetBtnEl = document.getElementById("reset");
let resetAreaEl = document.getElementById("reset-main-area");
let resetFinalAreaEl = document.getElementById("reset-final-area");
let resetConfitmationAreaEl = document.getElementById("reset-confirm-area");
let resetCancelBtnEl = document.getElementById("reset-cancel");
let resetDeleteBtnEl = document.getElementById("reset-delete");

resetBtnEl.addEventListener("click", async () => {
    resetAreaEl.classList.add("hide");
    resetConfitmationAreaEl.classList.remove("hide");
});

resetCancelBtnEl.addEventListener("click", async () => {
    resetConfitmationAreaEl.classList.add("hide");
    resetAreaEl.classList.remove("hide");
});

resetDeleteBtnEl.addEventListener("click", async () => {
    resetConfitmationAreaEl.classList.add("hide");
    resetAreaEl.classList.remove("hide");
    clearStorage();
    resetFinalAreaEl.classList.remove("hide");
});

function clearStorage(){
    chrome.storage.local.clear();
}