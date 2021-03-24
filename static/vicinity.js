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
    let currentSettings = getSettings();
    let currentVicinity = currentSettings.vicinity;
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

        //-- drag and drop ----------------------
        theMedia.addEventListener("touchstart", dragStart, false);
        theMedia.addEventListener("touchend", dragEnd, false);
        theMedia.addEventListener("touchmove", drag, false);
        theMedia.addEventListener("mousedown", dragStart, false);
        theMedia.addEventListener("mouseup", dragEnd, false);
        theMedia.addEventListener("mousemove", drag, false);

        //-- close ----------------------
        div = document.createElement('div');
        div.id = 'close-' + theMedia.id;
        div.classList.add('v-close');
        div.classList.add('fas');
        div.classList.add('fa-window-close');
        div.style.display="none";
        div.onclick = function(e) {
            e.preventDefault();
            let indexid = e.target.id.substr(11,3);// 3 is a max
            let div = document.getElementById('peer-'+indexid);
            div.classList.remove('v-peer-expand');
            div.classList.add('v-peer');

            users[div.dataset.userid].media[parseInt(div.dataset.index)].expanded=0;

            e.target.style.display="none";
            if(users[div.dataset.userid].expanded==0) {
                div.style.display="none";
            }else{
                //-- compute position
                computePositionMedia(div.dataset.userid,parseInt(div.dataset.index));
            }

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

            theMedia.style.display="none";
        }

        //-- DOM --------------
        oldParent.childNodes[0].appendChild(div); // close
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
        user.addEventListener("touchmove", drag, false);

        user.addEventListener("mousedown", dragStart, false);
        user.addEventListener("mousemove", drag, false);
    }else{
    }

    user.addEventListener("touchend", dragEnd, false);
    user.addEventListener("mouseup", dragEnd, false);
    user.addEventListener("contextmenu", rightClick, false);

    //-- zones ---
    div = document.getElementById('list-zones-v');
    let zone = document.createElement('div');
    zone.id = 'zone-v-' + id;
    zone.classList.add("zone-v");
    for(var i=1; i<=5 ;i++){
        let subzone = document.createElement('div');
        subzone.classList.add("sub-zone");
        subzone.classList.add("subzone"+i);
        zone.appendChild(subzone);
    }
     zone.style.display="none";
    div.appendChild(zone);

    //-- btns ---
    div = document.getElementById('list-buttons-v');
    //-- zone ---
    let btn = document.createElement('div');
    btn.id = 'btn-zone-v-' + id;
    btn.classList.add("btn-zone-v");
    div.appendChild(btn);
    btn.onclick = function(e) {
        e.preventDefault();
        let indexid = e.target.id.substr(11,e.target.id.length);
        let div = document.getElementById('zone-v-'+indexid);
        if(div.style.display==="none") {
            div.style.display="block";
            e.target.style.borderWidth="2px";
            e.target.style.borderColor="#28a745";
        }else{
            div.style.display="none";
            e.target.style.borderWidth="1px";
            e.target.style.borderColor="#000";
        }

    };
    //-- msg ---
    btn = document.createElement('div');
    btn.id = 'btn-msg-v-' + id;
    btn.classList.add("btn-msg-v");

    let insidebtn = document.createElement('div');
    insidebtn.classList.add('fas');
    insidebtn.classList.add('fa-comment');
    btn.appendChild(insidebtn);
    //btn.innerHTML='<i class="fas fa-record-vinyl" aria-hidden="true"></i>';
    div.appendChild(btn);
    btn.onclick = function(e) {


    };
}

/**
 * @param {string} id
 * @param {string} name
 */
function delUserVicinity(id, name) {
    let div = document.getElementById('list-users-v');
    let user = document.getElementById('user-v-' + id);
    div.removeChild(user);

    div = document.getElementById('list-zones-v');
    user = document.getElementById('zone-v-' + id);
    div.removeChild(user);

    div = document.getElementById('list-buttons-v');
    user = document.getElementById('btn-zone-v-' + id);
    div.removeChild(user);
    user = document.getElementById('btn-msg-v-' + id);
    div.removeChild(user);

}

/**
 * @param {Object} e
 */
function rightClick(e) {

    e.preventDefault();
    let target=e.target;
    let thisid=e.target.id.substr(7,e.target.id.length);
    let btn = document.getElementById('btn-zone-v-' + thisid);
    let btnmsg = document.getElementById('btn-msg-v-' + thisid);

    if(users[thisid].expanded===0) {
        users[thisid].expanded=1;
        target.classList.add("userv-expanded");

        //-- sound zone -----------------
        let zone = document.getElementById('zone-v-' + thisid);
        zone.style.left=(users[thisid].x-((v_params.zone_w-50)/2))+"px";
        zone.style.top=(users[thisid].y-((v_params.zone_w-50)/2))+"px";

        // @ TODO optimize in the future. Keep like that for the prototype
        let btnx = (users[thisid].x + 25) + (v_params.radius * Math.cos(v_params.offsetangle + v_params.angle));
        let btny = (users[thisid].y + 12) + (v_params.radius * Math.sin(v_params.offsetangle + v_params.angle));
        btn.style.left=btnx - (40/2)+"px";
        btn.style.top=btny - (40/2)+"px"; //!!!!!!!!!! Attention : la bulle scalée est plus haute que large d'où le 25 et 12
        btn.style.display="block";

         btnx = (users[thisid].x + 25) + (v_params.radius * Math.cos(v_params.offsetangle + v_params.angle*2));
         btny = (users[thisid].y + 12) + (v_params.radius * Math.sin(v_params.offsetangle + v_params.angle*2));
        btnmsg.style.left=btnx - (40/2)+"px";
        btnmsg.style.top=btny - (40/2)+"px";
        btnmsg.style.display="block";


        //-- media ----------------------
        for(var i=0;i<users[thisid].media.length;i++){
            if(users[thisid].media[i].expanded===0) {
                computePositionMedia(thisid,i);
                let peerid = "peer-"+users[thisid].media[i].id.substr(6,2);
                let div = document.getElementById(peerid);
                div.style.display="block";
            }else{
                // expanded
            }
        }

    }else{

    }
    return false;
}

function computePositionMedia(thisid,i){
    let mx = (users[thisid].x + 25) + (v_params.radius * Math.cos(v_params.offsetangle + (v_params.angle*(i+3))));
    let my = (users[thisid].y + 12) + (v_params.radius * Math.sin(v_params.offsetangle + (v_params.angle*(i+3))));
    users[thisid].media[i].x=mx - 25;
    users[thisid].media[i].y=my - 25;

    let peerid = "peer-"+users[thisid].media[i].id.substr(6,2);
    let div = document.getElementById(peerid);
    div.style.left=(mx - 25)+"px";
    div.style.top=(my - 25)+"px";
    div.dataset.currentx=(mx - 25);
    div.dataset.currenty=(my - 25);
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
    let allowedToMove=false;
    let expanded=0;

    switch(target.classList[0]){
        case "user-v":
        case "peer":
             //-- controle : is it expanded ?
            if(target.classList[0]==="user-v") {
                expanded = users[serverConnection.id].expanded;
                if(expanded===0){
                    allowedToMove=true;
                }else{
                    // not allowed to drag
                }
            }else{
                expanded = users[target.dataset.userid].media[parseInt(target.dataset.index)].expanded;
                if(expanded===0){
                    // not allowed to drag (the inverse)
                }else{
                    allowedToMove=true;
                }
            }
            //-- conclusion ---------
            if(allowedToMove===true) {
                target.style.cursor="grabbing";
                if (e.type === "touchstart") {
                    target.dataset.initialx = e.touches[0].clientX - xOffset;
                    target.dataset.initialy = e.touches[0].clientY - yOffset;
                } else {
                    target.dataset.initialx = e.clientX - xOffset - parseInt(target.dataset.currentx);
                    target.dataset.initialy = e.clientY - yOffset - parseInt(target.dataset.currenty);
                }
                target.dataset.active = "true";
                //-- prepare end
                if(target.classList[0]==="user-v") {
                    let userid = serverConnection.id;//target.id.substr(7,target.id.length);
                    users[userid].localx=parseInt(target.dataset.currentx);
                    users[userid].localy=parseInt(target.dataset.currenty);
                }else{
                }
            }else{
                // not allowed to drag
            }

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

        let data = {x:parseInt(target.dataset.currentx), y:parseInt(target.dataset.currenty)};
        if(target.classList[0]==="user-v") {
            users[serverConnection.id].x=data.x;
            users[serverConnection.id].y=data.y;
            computeVolume();
            computeEye();
            serverConnection.userMessage("setPos", null, data, true);

            //-- sound zone -----------------
            let zone = document.getElementById('zone-v-' + serverConnection.id);
            zone.style.left=(users[serverConnection.id].x-((v_params.zone_w-50)/2))+"px";
            zone.style.top=(users[serverConnection.id].y-((v_params.zone_w-50)/2))+"px";

        }else{
            users[target.dataset.userid].media[parseInt(target.dataset.index)].x=data.x;
            users[target.dataset.userid].media[parseInt(target.dataset.index)].y=data.y;
            // @TODO delete this case in usermedia message
            // data.cid=users[serverConnection.id].media[target.dataset.index].cid;
            // serverConnection.userMessage("setPosMedia", null, data, true);
        }
    }else{
    }
}
/**
 * @param {Object} e
 */
function dragEnd(e) {
    let target=e.target;
    if (target.dataset.active==="true") {
        switch(target.classList[0]) {
            case "user-v":
            case "peer":
                target.style.cursor="grab";
                target.dataset.active = "false";

                //-- position by default -----------
                let newPos = {x:target.dataset.currentx, y:target.dataset.currenty}
                let data = {x:parseInt(newPos.x), y:parseInt(newPos.y)}
                //-- user case :
                if(target.classList[0]==="user-v") {
                     newPos=computePosition(target.dataset.currentx, target.dataset.currenty);
                     data = {x:parseInt(newPos.x-v_params.offset_dragendx), y:parseInt(newPos.y-v_params.offset_dragendy)}
                    //-- sound zone -----------------
                    let zone = document.getElementById('zone-v-' + serverConnection.id);

                    if (data.x<v_params.hall_x) {
                        //-- if in SAS -------------
                        data.x=v_params.ori_x;
                        data.y=v_params.ori_y;
                        zone.style.display='none';

                        let btn = document.getElementById('btn-zone-v-' + serverConnection.id);
                        btn.style.borderWidth="1px";
                        btn.style.borderColor="#000";
                    }else{
                    }
                    zone.style.left=(data.x-((v_params.zone_w-50)/2))+"px";
                    zone.style.top=(data.y-((v_params.zone_w-50)/2))+"px";

                }else{
                }

                // memorisation position
                // @TODO : solve pb on tablet
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
                    users[target.dataset.userid].media[parseInt(target.dataset.index)].x=data.x;
                    users[target.dataset.userid].media[parseInt(target.dataset.index)].y=data.y;
                    // @TODO delete this case in usermedia message
                    //data.cid=users[serverConnection.id].media[target.dataset.index].cid;
                    //serverConnection.userMessage("setPosMedia", null, data, true);
                }
                break;
            default:
                break;
        }

    }else{
        // not drag
        if(target.classList[0]==="peer") {

            target.classList.remove('v-peer');
            // screenshare :
            target.classList.add('v-peer-expand');
            users[target.dataset.userid].media[parseInt(target.dataset.index)].expanded=1;
            let div = document.getElementById("close-"+target.id);
            div.style.display="block";

            if(users[target.dataset.userid].media[parseInt(target.dataset.index)].types.indexOf("screenshare") > -1) {
               // div.classList.add('front-over');
                //div = document.getElementById('grey-backgrd');
                //div.style.display="block";
            }else{

            }

        }else{
            // click on user that is already expanded
            let thisid=e.target.id.substr(7,e.target.id.length);

            if (users[thisid].expanded==1) {
                users[thisid].expanded=0;
                let btn = document.getElementById('btn-zone-v-' + thisid);
                let btnmsg = document.getElementById('btn-msg-v-' + thisid);
                target.classList.remove("userv-expanded");
                btn.style.display="none";
                btnmsg.style.display="none";

                for(var i=0;i<users[thisid].media.length;i++){
                    if(users[thisid].media[i].expanded===0) {
                        let peerid = "peer-"+users[thisid].media[i].id.substr(6,2);
                        let div = document.getElementById(peerid);
                        div.style.display="none";
                    }else{
                        // expanded
                    }

                }
            }else{
                // already 0
            }


        }
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

                //@TODO use the conditions in order to calibrate the sound
                /*
                if(distance<v_params.distance_confort) {
                    volume =v_params.linear_a*distance + v_params.linear_b;
                }else{
                    if(distance>v_params.distance_confortmax) {
                        volume =v_params.linear_a*distance + v_params.linear_b;
                    }else{

                    }

                }*/
                switch(v_params.type_gain){
                    case "linear":
                        volume =v_params.linear_a*distance + v_params.linear_b;
                        break;
                    case "1/d^2":
                        volume = Math.pow((v_params.gain_a +1)/(v_params.gain_a+distance),2);
                        break;
                    case "quadratic":
                        volume = Math.pow(distance,-v_params.gain_a);
                        break;
                }



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
    // @TODO rewrite this part
/*    for(var key in users) {
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
*/
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


    }
    div = document.getElementById('grey-backgrd');
    div.style.display="none";

};



/** Vicinity Initialisation */
function vicinityStart() {
    updateSetting("vicinity", "off");

    // parameters
    let linear_a = (1.0 - 0.0)/(55.0 - 180.0);
    let linear_b = 1.0 - 55.0*linear_a;

    // @TODO give the explaination and roles of the attributes and put it in an external file
    v_params={
        ori_x:10,
        ori_y:85,
        hall_x:60,
        out_x:-3000,

        linear_a:linear_a,
        linear_b:linear_b,
        gain_a:0,
        type_gain:"linear", // or "1/d^2" or "quadratic"
        offset_y:110,
        offset_dragendx:-5,
        offset_dragendy:25,
        distance_m:180,
        distance_confortmin:100,
        distance_confortmax:500,
        zone_w:250,
        angle:Math.PI/6,
        offsetangle:-Math.PI/2,
        radius:80
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

//-- @TODO remove after tests ------------------------
document.addEventListener("keydown", keyDownHandler, false);

function keyDownHandler(e) {
    var keyOn = e.key;
    switch(keyOn){
        case "1":
            //v_params.type_gain="linear";
            serverConnection.chat('', '', "linear");
            serverConnection.userMessage("gainMethod1", null, '', false);
            break;
        case "2":
            //v_params.type_gain="1/d^2";
            //v_params.gain_a = -0.9;
            serverConnection.chat('', '', "1/d^2 et a= -0.9");
            serverConnection.userMessage("gainMethod2", null, '', false);
            break;
        case "3":
            //v_params.type_gain="1/d^2";
            //v_params.gain_a = 30;
            serverConnection.chat('', '', "1/d^2 et a=30");
            serverConnection.userMessage("gainMethod3", null, '', false);
            break;
        case "4":
            //v_params.type_gain="1/d^2";
            //v_params.gain_a = 50;
            serverConnection.chat('', '', "1/d^2 et a=50");
            serverConnection.userMessage("gainMethod4", null, '', false);
            break;
        case "5":
            //v_params.type_gain="1/d^2";
            //v_params.gain_a = 100;
            serverConnection.chat('', '', "1/d^2 et a=100");
            serverConnection.userMessage("gainMethod5", null, '', false);
            break;
        case "6":
            //v_params.type_gain="quadratic";
            //v_params.gain_a = 0;
            serverConnection.chat('', '', "quadratic et a=0");
            serverConnection.userMessage("gainMethod6", null, '', false);
            break;
        case "7":
            //v_params.type_gain="quadratic";
           // v_params.gain_a = 4;
            serverConnection.chat('', '', "quadratic et a=4");
            serverConnection.userMessage("gainMethod7", null, '', false);
            break;
        case "8":
            //v_params.type_gain="quadratic";
            //v_params.gain_a = 5;
            serverConnection.chat('', '', "quadratic et a=5");
            serverConnection.userMessage("gainMethod8", null, '', false);
            break;
    }
}