const status=document.querySelector('#copy-status');
for(const button of document.querySelectorAll('[data-copy]')){
  button.addEventListener('click',async()=>{
    const input=document.getElementById(button.dataset.copy);
    try{
      await navigator.clipboard.writeText(input.value);
      status.textContent=button.dataset.copy==='card-url'?'Card URL copied.':'Text message copied.';
    }catch{
      input.focus();
      input.select();
      status.textContent='Text selected. Use your device’s Copy command.';
    }
  });
}
