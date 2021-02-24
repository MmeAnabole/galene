// Copyright (c) 2020 by Juliusz Chroboczek.

// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.  IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.



/** A toggle button to switch between modes. */
getButtonElement('vicinitybutton').onclick = function(e) {
    e.preventDefault();
    // get current vicinity mode ----------
    let currentSettings = getSettings();
    let currentVicinity = "off";
    if (typeof(currentSettings.vicinity)==='undefined') {
        // "off"
    }else{
        currentVicinity = currentSettings.vicinity;
    }
    // toggle -----------------------------
    if (currentVicinity==="off") {
        currentVicinity="on";
        setVisibility("video-container", false)
        setVisibility("vicinity-container", true)
        getButtonElement('vicinitybutton').innerHTML="Standard Mode";
    }else{
        currentVicinity="off";
        setVisibility("video-container", true)
        setVisibility("vicinity-container", false)
        getButtonElement('vicinitybutton').innerHTML="Vicinity Mode";
    }
    updateSetting("vicinity", currentVicinity)

};

/**
 * @param {string} id
 * @param {string} name
 */
function addUserVicinity(id, name){
    let div = document.getElementById('vicinity-container');
    let user = document.createElement('div');
    user.id = 'user-v-' + id;
    user.classList.add("user-v");
    user.textContent = name ? name : '(anon)';

    div.appendChild(user);
    let us = div.children;

    user.style.left=(us.length*150)+"px";
    user.dataset.currentx=(us.length*150);
    user.dataset.currenty=20;
    user.dataset.initialx=(us.length*150);
    user.dataset.initialy=20;
    user.dataset.active="false";

    // prepare drag and drop ------------
    user.addEventListener("touchstart", dragStart, false);
    user.addEventListener("touchend", dragEnd, false);
    user.addEventListener("touchmove", drag, false);
    user.addEventListener("mousedown", dragStart, false);
    user.addEventListener("mouseup", dragEnd, false);
    user.addEventListener("mousemove", drag, false);
}

/**
 * @param {string} id
 * @param {string} name
 */
function delUserVicinity(id, name) {
    let div = document.getElementById('vicinity-container');
    let user = document.getElementById('user-v-' + id);
    div.removeChild(user);
}

/**
 * @param {Object} e
 */
function dragStart(e) {
    let div = document.getElementById("right");
    var xOffset = div.offsetLeft;
    var yOffset = div.offsetTop;

    let target=e.target;
    if (e.type === "touchstart") {
        target.dataset.initialx = e.touches[0].clientX - xOffset;
        target.dataset.initialy = e.touches[0].clientY - yOffset;
    } else {
        target.dataset.initialx = e.clientX - xOffset - target.dataset.currentx;
        target.dataset.initialy = e.clientY - yOffset - target.dataset.currenty;
    }

    //console.log(e.clientX)
    target.dataset.active = "true";
}

/**
 * @param {Object} e
 */
function dragEnd(e) {
    let target=e.target;
    target.dataset.active = "false";
    handleCoord( target.dataset.currentx, target.dataset.currenty, target.id)
}

/**
 * @param {Object} e
 */
function drag(e) {
    let div = document.getElementById("right");
    var xOffset = div.offsetLeft;
    var yOffset = div.offsetTop;

    let target=e.target;

    if (target.dataset.active==="true") {

        e.preventDefault();

        if (e.type === "touchmove") {
            target.dataset.currentx = e.touches[0].clientX - xOffset - target.dataset.initialx;
            target.dataset.currenty = e.touches[0].clientY - yOffset - target.dataset.initialy;
        } else {
            target.dataset.currentx = e.clientX - xOffset - target.dataset.initialx;
            target.dataset.currenty = e.clientY - yOffset - target.dataset.initialy;
        }
        setTranslate(target.dataset.currentx, target.dataset.currenty, target);
    }else{
    }
}

/**
 * @param {number} xPos
 * @param {number} yPos
 * @param {Object} el
 */
function setTranslate(xPos, yPos, el) {

    el.style.top=yPos+"px";
    el.style.left=xPos+"px";
}

/**
 * @param {number} xPos
 * @param {number} yPos
 * @param {string} id
 */
function handleCoord(xPos,yPos,id) {

    let message, me;

    message = "$"+id+"/"+xPos+"/"+yPos;
    me = false;

    if(!serverConnection || !serverConnection.socket) {
        //displayError("Not connected.");
        return;
    }

    try {
        serverConnection.chat(me ? 'me' : '', '', message);
    } catch(e) {
        console.error(e);
        displayError(e);
    }
}

/** Vicinity Initialisation */
function vicinityStart() {
    updateSetting("vicinity", "off")

    // color interface
    let htmlText    = "";
    let tabBckgColors = ["#741981","#9e0b7b","#c20a70","#de2361","#f24250","#ff633c","#ff8525","#ffa600"]
    for(var i=0;i<tabBckgColors.length;i++){
        htmlText += '<div class="btn-color" id="btn-color'+i+'" ></div>';
        htmlText += "\n";
    }
    document.getElementById('vicinity-listColors').innerHTML = htmlText;
    for(var i=0;i<tabBckgColors.length;i++){
        document.getElementById('btn-color'+i).style.backgroundColor=tabBckgColors[i];
        document.getElementById('btn-color'+i).onclick = function(e) {
            e.preventDefault()
            let mycolor = document.getElementById(this.id).style.backgroundColor;
            document.querySelectorAll('.btn-color').forEach(function(button) {
                button.style.borderWidth='1px';
            });
            document.getElementById(this.id).style.borderWidth='6px';
            getInputElement('usercolor').value=mycolor;
        };
    }
    document.getElementById('btn-color'+0).style.borderWidth='6px';
    getInputElement('usercolor').value=tabBckgColors[0];



}
vicinityStart();