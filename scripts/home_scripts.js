

document.getElementById("rowpic").addEventListener("mouseenter", ()=> {
    console.log("hover")
    document.getElementById("retro_row_pic").animate([
        {opacity:"1"},
        {opacity:"0"}
    ], {duration: 500});
    document.getElementById("retro_row_pic").style.opacity=0;
});

document.getElementById("rowpic").addEventListener("mouseleave", ()=> {
    console.log("hover")
    document.getElementById("retro_row_pic").animate([
        {opacity:"0"},
        {opacity:"1"}
    ], {duration: 500});
    document.getElementById("retro_row_pic").style.opacity=1;
});


