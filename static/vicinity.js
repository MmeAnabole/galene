// Copyright (c) 2021 by Sylvie Tissot.

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

/** @type {object} */
let v_params;

/** A toggle button to switch between modes. */
getButtonElement('vicinitybutton').onclick = function(e) {
    e.preventDefault();
    // @TODO remove the control : get current vicinity mode ----------
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
        getButtonElement('vicinitybutton').innerHTML="Standard Mode";
     }else{
        currentVicinity="off";
        getButtonElement('vicinitybutton').innerHTML="Vicinity Mode";
     }
    setVicinity(currentVicinity);
    serverConnection.userMessage("setVicinity", null, currentVicinity, false);

};


/**
 * @param {string} state
 */
function setVicinity(state){
    //-- chat off -------------------------
    let left = document.getElementById("left");
    left.style.display = "none";
    document.getElementById('collapse-video').style.display = "block";

    if(state==="on") {
        setVisibility("video-container", false);
        setVisibility("vicinity-container", true);
        setVisibility('bullhornbutton', true);

        // media
        mediaVicinity();
        computeEye();
        computeVolume();
    }else{
        setVisibility("video-container", true);
        let video_container = document.getElementById('video-container');
        video_container.classList.remove('no-video');
        setVisibility("vicinity-container", false);
        setVisibility('bullhornbutton', false);
        // @TODO reset volume to slider value

         var oldParent = document.getElementById('list-media-v');
         var newParent = document.getElementById('peers');

         while (oldParent.childNodes.length > 0) {
             let theMedia = oldParent.childNodes[0];
             let div=document.getElementById('eye-'+theMedia.id);
             //-- eye -------------
             oldParent.childNodes[0].removeChild(div);
             // @TODO removeEvent
             theMedia.classList.remove('v-peer');
             theMedia.style.left='unset';
             theMedia.style.top='unset';
             newParent.appendChild(oldParent.childNodes[0]);
         }

    }
    updateSetting("vicinity", state);
}
/** replace media */
function mediaVicinity(){
    let newParent = document.getElementById('list-media-v');
    let oldParent = document.getElementById('peers');
    while (oldParent.childNodes.length > 0) {
        let theMedia = oldParent.childNodes[0];
        let indexid = theMedia.id.substr(5,2);
        // @TODO avoid DOM dataset for currentx, currenty, initialx and initialy. Keep dataset only for userid, type (user or media) and index
        let userData = getUserFromMedia("media-"+indexid);
        theMedia.dataset.userid = userData.userid;
        theMedia.dataset.index = userData.index;
        //-- eye -------------
        div = document.createElement('div');
        div.id = 'eye-' + theMedia.id;
        div.classList.add('v-eye');
        div.classList.add('fas');
        div.classList.add('fa-eye');
        div.onclick = function(e) {
            e.preventDefault();
            let indexid = e.target.id.substr(9,2);
            let div = document.getElementById('peer-'+indexid);
            div.style.left='unset';
            div.style.top='unset';
            div.classList.remove('v-peer');
            div.classList.add('front-over');

            div = document.getElementById('grey-backgrd');
            div.style.display="block";
            div = document.getElementById('eye-peer-'+indexid);
            div.style.display="none";

        };
        //-- style and position --------------
        theMedia.classList.add('v-peer');
        if(userData.userid==="") {
            //impossible ?
            theMedia.style.left=v_params.out_x+"px";
        }else{
            let xdef=users[userData.userid].media[userData.index].x;
            let ydef=users[userData.userid].media[userData.index].y;
            if(userData.userid===serverConnection.id) {
                theMedia.addEventListener("touchstart", dragStart, false);
                theMedia.addEventListener("touchend", dragEnd, false);
                theMedia.addEventListener("touchmove", drag, false);
                theMedia.addEventListener("mousedown", dragStart, false);
                theMedia.addEventListener("mouseup", dragEnd, false);
                theMedia.addEventListener("mousemove", drag, false);

                if(users[serverConnection.id].x<=v_params.hall_x) {
                    theMedia.style.display="none";
                }else{
                    theMedia.style.display="block";
                }
            }else{
                if (xdef<v_params.hall_x) {
                    xdef=v_params.out_x;
                }else{
                }
            }
            theMedia.dataset.currentx=xdef;
            theMedia.dataset.currenty=ydef;
            theMedia.style.left=xdef+"px";
            theMedia.style.top=ydef+"px";
        }

        //-- DOM --------------
        oldParent.childNodes[0].appendChild(div);
        newParent.appendChild(oldParent.childNodes[0]);
    }
}
/**
 * @param {string} id
 */
function getUserFromMedia(id){
    let foundedObject={userid:"",index:-1}
    //-- users
    for(var key in users) {
        let founded = -1;
        for(var i=0;i<users[key].media.length; i++){
            if(users[key].media[i].id===id) {
                founded = i;
            }else{
            }
        }
        if (founded>-1) {
            foundedObject.userid=key;
            foundedObject.index=founded;
        }else{
        }
    }
    return foundedObject;
}

/**
 * @param {string} id
 */
function getUserFromStream(id){
    let foundedObject={userid:"",index:-1}
    //-- users
    for(var key in users) {
        let founded = -1;
        for(var i=0;i<users[key].media.length; i++){
            if(users[key].media[i].cid===id) {
                founded = i;
            }else{
            }
        }
        if (founded>-1) {
            foundedObject.userid=key;
            foundedObject.index=founded;
        }else{
        }
    }
    return foundedObject;
}
/**
 * @param {string} id
 * @param {string} name
 */
function addUserVicinity(id, name){
    let div = document.getElementById('list-users-v');
    let user = document.createElement('div');
    user.id = 'user-v-' + id;
    user.classList.add("user-v");
    let currentName= name ? name : '(anon)';
    user.innerHTML = '<div class="circle" id="circle-v-'+id+'"><div class="fas" aria-hidden="true"></div></div><div class="texte">'+currentName+'</div>'

    div.appendChild(user);
    let us = div.children;
    user.dataset.active="false";

    if(id===serverConnection.id) {
        // prepare drag and drop ------------
        user.style.zIndex=2;
        user.addEventListener("mouseover", dragOver, false);
        user.addEventListener("mouseout", dragOut, false);
        user.addEventListener("touchstart", dragStart, false);
        user.addEventListener("touchend", dragEnd, false);
        user.addEventListener("touchmove", drag, false);
        user.addEventListener("mousedown", dragStart, false);
        user.addEventListener("mouseup", dragEnd, false);
        user.addEventListener("mousemove", drag, false);
    }else{
    }

}

/**
 * @param {string} id
 * @param {string} name
 */
function delUserVicinity(id, name) {
    let div = document.getElementById('list-users-v');
    let user = document.getElementById('user-v-' + id);
    div.removeChild(user);
}

/**
 * @param {Object} e
 */
function dragOver(e) {
    e.preventDefault();
    let target=e.target;
    let circle = target.children[0];
    circle.style.borderColor="#000";
}
/**
 * @param {Object} e
 */
function dragOut(e) {
    e.preventDefault();
    let target=e.target;
    let circle = target.children[0];
    circle.style.borderColor="#DDD";
}
/**
 * @param {Object} e
 */
function dragStart(e) {
    let div = document.getElementById("right");
    var xOffset = div.offsetLeft;
    var yOffset = div.offsetTop;

    let target=e.target;
    switch(target.classList[0]){
        case "user-v":
        case "peer":
            target.style.cursor="grabbing";
            if (e.type === "touchstart") {
                target.dataset.initialx = e.touches[0].clientX - xOffset;
                target.dataset.initialy = e.touches[0].clientY - yOffset;
            } else {
                target.dataset.initialx = e.clientX - xOffset - parseInt(target.dataset.currentx);
                target.dataset.initialy = e.clientY - yOffset - parseInt(target.dataset.currenty);
            }
            target.dataset.active = "true";
            break;
        default:
            break;
    }
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
            target.dataset.currentx = e.touches[0].clientX - xOffset - parseInt(target.dataset.initialx);
            target.dataset.currenty = e.touches[0].clientY - yOffset - parseInt(target.dataset.initialy);
        } else {
            target.dataset.currentx = e.clientX - xOffset - parseInt(target.dataset.initialx);
            target.dataset.currenty = e.clientY - yOffset - parseInt(target.dataset.initialy);
        }
        setTranslate(target.dataset.currentx, target.dataset.currenty, target);

        let data = {x:target.dataset.currentx, y:target.dataset.currenty};
        if(target.classList[0]==="user-v") {
            users[serverConnection.id].x=data.x;
            users[serverConnection.id].y=data.y;
            computeVolume();
            computeEye();
            serverConnection.userMessage("setPos", null, data, true);
        }else{
            users[serverConnection.id].media[target.dataset.index].x=data.x;
            users[serverConnection.id].media[target.dataset.index].y=data.y;
            data.cid=users[serverConnection.id].media[target.dataset.index].cid;
            serverConnection.userMessage("setPosMedia", null, data, true);
        }

    }else{
    }
}
/**
 * @param {Object} e
 */
function dragEnd(e) {
    let target=e.target;
    switch(target.classList[0]) {
        case "user-v":
        case "peer":
            target.style.cursor="grab";
            target.dataset.active = "false";

            let newPos=computePosition(target.dataset.currentx, target.dataset.currenty);
            let data = {x:newPos.x-v_params.offset_dragendx, y:newPos.y-v_params.offset_dragendy}

            if (data.x<v_params.hall_x) {
                data.x=v_params.ori_x;
                if(target.classList[0]==="user-v") {
                    data.y=v_params.ori_y;

                    for(var i=0;i<users[serverConnection.id].media.length;i++){
                        let peerid = "peer-"+users[serverConnection.id].media[i].id.substr(6,2);
                        let div = document.getElementById(peerid);
                        div.style.display="none";
                    }
                }else{
                    data.y=v_params.ori_y+(parseInt(target.dataset.index)+1)*v_params.offset_y;
                }
            }else{
                if(target.classList[0]==="user-v") {
                    for(var i=0;i<users[serverConnection.id].media.length;i++){
                        let peerid = "peer-"+users[serverConnection.id].media[i].id.substr(6,2);
                        let div = document.getElementById(peerid);
                        div.style.display="block";
                    }
                }else{
                }
            }
            target.dataset.currentx=data.x;
            target.dataset.currenty=data.y;
            target.style.left=target.dataset.currentx+"px";
            target.style.top=target.dataset.currenty+"px";

            if(target.classList[0]==="user-v") {
                users[serverConnection.id].x=data.x;
                users[serverConnection.id].y=data.y;
                computeVolume();
                computeEye();
                serverConnection.userMessage("setPos", null, data, true);
            }else{
                users[serverConnection.id].media[target.dataset.index].x=data.x;
                users[serverConnection.id].media[target.dataset.index].y=data.y;
                data.cid=users[serverConnection.id].media[target.dataset.index].cid;
                serverConnection.userMessage("setPosMedia", null, data, true);
            }
            break;
        default:
            break;
    }

}
/**
 * @param {number} xPos
 * @param {number} yPos
 * @returns {Object}
 */
function computePosition(xPos, yPos){
    let r, s;
    let xm, ym;
    let nearestH;
    xm=xPos;
    ym=yPos;
    r = 30;
    s = Math.sqrt(3 * Math.pow(r, 2) / 4);
    nearestH={x:0,y:0,dist:10000};

    // create hexagons
    let counter = 0;
    let currentDist;
    for (let y = 0; y < 1080 + s; y += 2*s) {
        for (let x = 0; x < 1920 + r; x += 3*r) {
            currentDist = distancePoints(xm, ym, x,y);
            if(currentDist < nearestH.dist) {
                nearestH.x=x;
                nearestH.y=y;
                nearestH.dist=currentDist;
            }else{
            }
            currentDist = distancePoints(xm, ym, x + 1.5 * r,y + s);
            if(currentDist < nearestH.dist) {
                nearestH.x=x + 1.5 * r;
                nearestH.y=y + s;
                nearestH.dist=currentDist;
            }else{
            }
        }
    }
    return (nearestH);
}
/**
 * @param {number} xm
 * @param {number} ym
 * @param {number} x
 * @param {number} y
 */
function distancePoints(xm, ym, x,y) {
    let distsquare = (xm - x)*(xm - x) + (ym - y)*(ym - y);
    return Math.sqrt(distsquare);
}


function computeVolume(){
    for(var key in users) {
        if(key===serverConnection.id) {
            // nothing
        }else{
            let volume= 1;
            if( users[key].bullhorn===true) {
                // all is high
            }else{
                let distance=distancePoints(users[serverConnection.id].x, users[serverConnection.id].y, users[key].x, users[key].y);
                volume=v_params.linear_a*distance + v_params.linear_b;
                volume = Math.max(0,volume);
                volume = Math.min(1,volume);
            }

            let nbmedia = users[key].media.length;
            for(var i=0;i<nbmedia; i++){
                let media = document.getElementById(users[key].media[i].id);
                media.volume=volume;
            }
        }

    }
}

function computeEye(){
    for(var key in users) {
        if(key===serverConnection.id) {
            // nothing
        }else{
            for(var i=0;i<users[key].media.length; i++){
                let peerid = "peer-"+users[key].media[i].id.substr(6,2);
                let div = document.getElementById('eye-'+peerid);
                let distance=distancePoints(users[serverConnection.id].x, users[serverConnection.id].y, users[key].media[i].x, users[key].media[i].y);
                if (distance < v_params.distance_m) {
                    div.style.display="block";
                }else{
                    if( users[key].bullhorn===true) {
                        div.style.display="block";
                    }else{
                        div.style.display="none";
                    }
                }
            }
         }
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



/** bullHorn Button */
document.getElementById('bullhornbutton').onclick = function(e) {
    e.preventDefault();
    let bullhorn = getSettings().bullhorn;
    bullhorn = !bullhorn;
    updateSetting("bullhorn", bullhorn);
    users[serverConnection.id].bullhorn=bullhorn;

    //-- button look
    div = document.getElementById('user-v-'+serverConnection.id);
    divHornBtn = document.getElementById('bullhornbutton');
    let circle = div.children[0];
    let icon = circle.children[0];
    if(bullhorn===true) {
        icon.classList.add("fa-bullhorn")
        divHornBtn.classList.remove("muted")
    }else{
        icon.classList.remove("fa-bullhorn")
        divHornBtn.classList.add("muted")
    }
    //-- notification
    serverConnection.userMessage("setBullhorn", null, bullhorn, true);

};

/** closemediav Button */
document.getElementById('closemediav').onclick = function(e) {
    e.preventDefault();
    let arrayDiv=document.getElementsByClassName('front-over');
    for(var i=0;i<arrayDiv.length;i++){
        // normaly : only one
        div = arrayDiv[i];
        div.classList.remove('front-over');
        div.classList.add('v-peer');

        div.style.left=div.dataset.currentx+"px";
        div.style.top=div.dataset.currenty+"px";

        div = document.getElementById('eye-'+div.id);
        div.style.display="block";
    }
    div = document.getElementById('grey-backgrd');
    div.style.display="none";

};



/** Vicinity Initialisation */
function vicinityStart() {
    updateSetting("vicinity", "off");

    // parameters
    let linear_a = (1.0 - 0.0)/(55.0 - 110.0);
    let linear_b = 1.0 - 55.0*linear_a;

    v_params={
        ori_x:10,
        ori_y:85,
        hall_x:60,
        out_x:-3000,
        linear_a:linear_a,
        linear_b:linear_b,
        offset_y:110,
        offset_dragendx:-5,
        offset_dragendy:25,
        distance_m:110
    };
    // color interface

    let htmlText    = "";
    let tabBckgColors = [" #741981", " #9e0b7b", " #c20a70", " #de2361", " #f24250", " #ff633c", " #ff8525", " #ffa600"];
    for(let i=0;i<tabBckgColors.length;i++){
        htmlText += '<div class="btn-color" id="btn-color'+i+'" myColor="'+i+'"></div>';
        htmlText += "\n";
    }
    /*let tabBckgColors = [];
    for(let i=0;i<8;i++){
        tabBckgColors[i]=window.getComputedStyle(document.documentElement).getPropertyValue('--color'+i)
        htmlText += '<div class="btn-color" id="btn-color'+i+'" myColor="'+i+'"></div>';
        htmlText += "\n";
    }*/
    document.getElementById('vicinity-listColors').innerHTML = htmlText;

    for(var i=0;i<tabBckgColors.length;i++){
        document.getElementById('btn-color'+i).style.backgroundColor=tabBckgColors[i];
        document.getElementById('btn-color'+i).onclick = function(e) {
            e.preventDefault()
            let mycolor = document.getElementById(this.id).getAttribute('mycolor')
            document.querySelectorAll('.btn-color').forEach(function(button) {
                button.style.borderWidth='1px';
            });
            document.getElementById(this.id).style.borderWidth='6px';
            getInputElement('usercolor').value=mycolor;
        };
    }
    document.getElementById('btn-color'+0).style.borderWidth='6px';
    getInputElement('usercolor').value=0;

}
vicinityStart();