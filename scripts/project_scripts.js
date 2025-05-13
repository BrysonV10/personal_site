let headings = document.querySelectorAll(".projectHeading");

for(let i=0;i<headings.length;i++){
    headings[i].addEventListener("click", ()=> {
        let content = document.getElementById(headings[i].dataset.content);
        if(content.style.display === "block"){
            content.style.display = "none";
            headings[i].innerText = headings[i].innerText.replaceAll("↑", "↓");
        }
        else{
            content.style.display = "block";
            headings[i].innerText = headings[i].innerText.replaceAll("↓", "↑");
        }
})}

document.getElementById("viewall").addEventListener("click", () => {
    if(document.getElementById("viewall").innerText === "View All"){
    for(let i=0;i<headings.length;i++){
        let content = document.getElementById(headings[i].dataset.content);
        if(content.style.display === "none" || content.style.display === ""){
            content.style.display = "block";
            headings[i].innerText = headings[i].innerText.replaceAll("↓", "↑");
        }
    }
    document.getElementById("viewall").innerText = "View Less";
    } else {
        for(let i=0;i<headings.length;i++){
            let content = document.getElementById(headings[i].dataset.content);
            if(content.style.display === "block"){
                content.style.display = "none";
                headings[i].innerText = headings[i].innerText.replaceAll("↑", "↓");
            }
        }
        document.getElementById("viewall").innerText = "View All";
    }
});