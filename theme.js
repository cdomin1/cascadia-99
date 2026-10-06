// Apply saved appearance before styles load; otherwise follow the device theme.
(()=>{
  const root=document.documentElement,system=matchMedia('(prefers-color-scheme: dark)');
  let preference=null,palette="arcade";
  try{const saved=localStorage.getItem("cascadia99-palette");if(Object.hasOwn(CascadiaPalettes,saved))palette=saved;}catch{}
  try{const saved=localStorage.getItem('panel99-theme');if(saved==='light'||saved==='dark')preference=saved;}catch{}
  function apply(){
    const dark=(preference|| (system.matches?'dark':'light'))==='dark';
    root.dataset.theme=dark?'dark':'light';root.dataset.palette=palette;
    const values=CascadiaPalettes[palette][dark?'dark':'light'];
    ['bg','surface','border','ink','muted','lime','teal','arcade-shadow','grid'].forEach((key,index)=>root.style.setProperty('--'+key,values[index]));
    const select=document.getElementById('palette');if(select)select.value=palette;
    const button=document.getElementById('theme');
    if(button){button.textContent=dark?'☀ Light':'☾ Dark';button.setAttribute('aria-label',`Switch to ${dark?'light':'dark'} mode`);button.setAttribute('aria-pressed',String(!dark));button.title=button.getAttribute('aria-label');}
  }
  apply();
  system.addEventListener('change',()=>{if(!preference)apply();});
  document.addEventListener('DOMContentLoaded',()=>{
    const select=document.getElementById('palette');
    for(const [id,entry]of Object.entries(CascadiaPalettes)){const option=document.createElement('option');option.value=id;option.textContent=entry.name;select.append(option);}
    select.addEventListener('change',()=>{if(!Object.hasOwn(CascadiaPalettes,select.value))return;palette=select.value;try{localStorage.setItem('cascadia99-palette',palette);}catch{}apply();document.dispatchEvent(new Event('palettechange'));});
    apply();document.getElementById('theme').addEventListener('click',()=>{
      preference=root.dataset.theme==='dark'?'light':'dark';
      try{localStorage.setItem('panel99-theme',preference);}catch{}
      apply();
    });
  });
})();
