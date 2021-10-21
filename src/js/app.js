//import 'svelte/ssr/register'
import xr from 'xr'
import Handlebars from 'handlebars/dist/handlebars'
import Scrolling from 'scrolling';
import Blazy from 'blazy';

import { groupBy } from './libs/arrayObjectUtils.js'
//import { share } from './libs/share.js';



//import gridTemplate from '../templates/grid.html' UNCOMMENT FOR TOP 100
//import listTemplate from '../templates/list.html' UNCOMMENT FOR TOP 100
import gridTemplate from '../templates/grid-ng.html' // Use for Next Gen Young Footballers
import listTemplate from '../templates/list-ng.html' // Use for Next Gen Young Footballers


import shares from './share'

let shareFn = shares('Next Generation 2017: 60 of the best young talents in world football', 'https://gu.com/p/793ff', '');


//import gridPicTemplate from '../templates/gridPic.html'
//import detailItemTemplate from '../templates/detailItem.html'
//import gridThumbTemplate from '../templates/thumbPic.html'
//import thumbsTemplate from '../templates/thumbsGallery.html'
//import cellTemplate from '../templates/gridCell.html'

//import animateScrollTo from 'animated-scroll-to'; //https://www.npmjs.com/package/animated-scroll-to

Handlebars.registerHelper("ifvalue", function(Index, conditional, options) {
    if (Number(Index) % Number(conditional) == 0 && Index > 0) {
        return options.fn(this);
    } else {
        return options.inverse(this);
    }
});

var data;
var gridViewBool = true;
var resizeTimeout = null;
var bLazy;
var lastScrollTop = 0;

var gridViewImageWidth = 500;
var listViewImageWidth = 500;


function isMobile() {
    var dummy = document.getElementById("gv-mobile-dummy");
    if (getStyle(dummy) == 'block') {
        return true;
    } else {
        return false;
    }
}

function getStyle(element) {
    return element.currentStyle ? element.currentStyle.display :
        getComputedStyle(element, null).display;
}

var url;
url= 'https://interactive.guim.co.uk/docsdata-test/1GdI8BEWzAB6CG8CkgSaypYhm9f9rje-kTNgBTe8_lXc.json';








xr.get(url).then((resp) => {

    //var data = formatData(resp.data.sheets.english);

    // !!!!!!!!!!! ALERT SHEET NAME HERE IS "english" !!!!!!!!!!!!!

    data = resp.data.sheets;
    data = cleanData(data);

    //console.log(data.english[0]);
    var compiledHTML = compileHTML(data);
    document.querySelector(".gv-grid-view-inner").innerHTML = compiledHTML.grid;
    document.querySelector(".gv-list-view-inner").innerHTML = compiledHTML.list;
    drawPositions(data.players);
    addListeners();
    //updatePageDate();
    //upDatePageView(data);
});

function cleanData(dataIn) {

    //console.log(dataIn);

    var obj, dataOut = {},
        arr;

    for (var key in dataIn) {

        arr = [];
        //var obj = data.messages[key];
        for (var i = 0; i < dataIn[key].length; i++) {
            obj = dataIn[key][i];
            obj["Index"] = i;
            obj["Rank"] = dataIn[key][i].Rank || i + 1;

            if ( obj["Rank"] <= 9) {
                obj["Rank"] = "0" + obj["Rank"];
            }



            obj["DOB_text"] = dataIn[key][i]["DOB text"];
            obj["Iso"] = String(dataIn[key][i]["ISO code"]).toLowerCase() || "_";
            //obj["Club"] = dataIn[key][i]["Club on 20 Dec 2017"];
            obj["Age"] = dataIn[key][i]["Age on 20 Dec 2017"];


            obj["Change"] =  getMovementText( dataIn[key][i]["Last year"], Number(dataIn[key][i]["Up or down"]), dataIn[key][i]["Up or down"]);

            // Corrections from old data

            // obj["Grid view image"] = obj["Thumb Image URL 500 x 500px"];
            // obj["Grid view image parameters"] = obj["Thumb Image Parameters"];
            // obj["Grid_image_src"] = obj["Grid view image"]; // No parameters used

            // obj["List view image"] = obj["Main Image URL landscape 900 x 506px"];
            // obj["List view image parameters"] = obj["Main Image Parameters"];
            // obj["List_image_src"] = obj["List view image"]; // No parameters used

            obj["Grid_image_src"] = obj["Facewall cell image GRID src"] + "/" + gridViewImageWidth + ".jpg"; // Uncomment Football 100
            obj["List_image_src"] = obj["Facewall main image GRID src"] + "/" + listViewImageWidth + ".jpg"; // Uncomment Football 100

            obj["Grid_image_src"] = obj["Grid view image"] + "/" + gridViewImageWidth + ".jpg";
            obj["List_image_src"] = obj["List view image"] + "/" + listViewImageWidth + ".jpg";

            obj["Grid_image_src"] = obj["Grid view image"];
            obj["List_image_src"] = obj["List view image"];

            obj["PublishClass"] = "gv-published";

            //console.log(obj["List_image_src"]);
            //if ( i < 50 ) {
            arr.push(obj);
            //}
            //console.log(i);
        }

        dataOut[key] = arr;

        if (key == "players") {

        var newArr = [].concat(arr);
            //Add inactive cells
        var populated = newArr.length;

        var remainderTotal = 100 - populated;

        //for ( var ii = (remainderTotal-1); ii > -1; ii -- ) {

        for ( var ii = 0; ii < remainderTotal; ii ++ ) {

            obj = {};
            obj["Grid_image_src"] = "<%= path %>/assets/silhouette.png";
            obj["List_image_src"] = "";
            obj["Rank"] = ii + 1;

            if ( obj["Rank"] <= 9) {
                obj["Rank"] = "0" + obj["Rank"];
            }
            obj["Index"] = populated + ii;
            obj["Name"] = "";
            obj["Club"] = "";
            obj["PublishClass"] = "gv-unpublished";
            obj["Filters"] = "";
            //newArr.push(obj); Uncomment for silhouettes in Football 100

        }

        dataOut["cells"] = newArr;

        }
    }

    return dataOut;
}

function compileHTML(dataIn) {

    var newHTML = {},
        content;

    Handlebars.registerHelper('html_decoder', function(text) {
        var str = unescape(text).replace(/&amp;/g, '&');
        return str;
    });

    // Handlebars.registerPartial({
    //     'gridCell': cellTemplate
    // });

    content = Handlebars.compile(
        gridTemplate, {
            compat: true
        }
    );

    newHTML.grid = content(dataIn);

    content = Handlebars.compile(
        listTemplate, {
            compat: true
        }
    );

    newHTML.list = content(dataIn);

    return newHTML

}

function addListeners() {


    document.querySelector('.toggle-view-overlay-btn').addEventListener('click', toggleView);
    document.querySelector('.gv-grid').addEventListener('click', updateOnGridClick);


    window.addEventListener('resize', function() {
        // clear the timeout
        clearTimeout(resizeTimeout);
        // start timing for event "completion"
        resizeTimeout = setTimeout(updateOnResize, 250);
    });

    window.onbeforeunload = function() { window.scrollTo(0, 0); } //resets scroll on load

    Scrolling(window, updateOnScroll); // method to add a scroll listener -- https://www.npmjs.com/package/scrolling

    bLazy = new Blazy({
        selector: ".gv-blazy",
        offset: 200
    });

    window.setTimeout(function() {
        updateLazyLoad();
    }, 200);

    checkFixElements();


    // [].slice.apply(document.querySelectorAll('.interactive-share')).forEach(shareEl => {
    //     var network = shareEl.getAttribute('data-network');
    //     shareEl.addEventListener('click', () => shareFn(network));
    // });

//     var playerFilter = document.getElementById("gv-player-filter");

//     playerFilter.addEventListener("change", function( e ) {
   
//     filterView( e.target.value );
// }, false );

}

function filterView ( value ) {

    var i, ii, selectedSet = [], deselectedSet = [], found, arr, val, index;

    

    var grid = document.getElementById('gv-grid'), cell;



    if ( value == "All players") {

        selectedSet = data.cells;

    } else {

        for (i = 0; i < data.cells.length; i++) {

        found = false;

        arr = String(data.cells[i]["Filters"]).split(",");



        for (ii = 0; ii < arr.length; ii++) {

            val = arr[ii].trim();


            if (val == value) {

                selectedSet.push(data.cells[i]);
                found = true;

                break;

            }

        }

        if (!found) {
            deselectedSet.push(data.cells[i]);
        }
    }


    }



    for (i = 0; i < selectedSet.length; i++) {


        index = selectedSet[i]["Index"];
        cell = document.getElementById('gv-grid-cell_' + index );
        cell.classList.remove('gv-deselected');
        grid.appendChild( cell );

    }

    for (i = 0; i < deselectedSet.length; i++) {


        index = deselectedSet[i]["Index"];
        cell = document.getElementById('gv-grid-cell_' + index );
        cell.classList.add('gv-deselected');
        grid.appendChild( cell );

    }




  //   divOne = document.getElementById('#div1');
  // divTwo = document.getElementById('#div2');
  // divThree = document.getElementById('#div3');
  // container = divOne.parentNode;
  // container.appendChild(divTwo);
  // container.appendChild(divOne);
  // container.appendChild(divThree);

}


function updateLazyLoad() {

    bLazy.revalidate();

    window.setTimeout(function() {
        updateLazyLoad();
    }, 1000);
}


function updateOnScroll() {
   
    //console.log(document.documentElement.scrollTop || document.body.scrollTop);
    checkFixElements();
}

function updateOnResize() {
    //console.log("resized");
    updateOnScroll();
}

function updateOnGridClick(e) {
    if (e.target !== e.currentTarget) {
        var clickedIndex = parseInt(e.target.dataset.index);
        e.stopPropagation();
        //console.log(clickedIndex);
        //alert(document.querySelector('.gv-grid-view').offsetTop);

        toggleView();
        jumpToIndex(clickedIndex);
    }

}

function toggleView() {
    //console.log("toggled");
    gridViewBool = !gridViewBool;

    if (gridViewBool) {
        showGrid();
    } else {
        hideGrid();
    }
}

function showGrid() {
    fixList(true);
    fixGrid(false);
    document.querySelector('.gv-grid-view').classList.remove('close');
    document.querySelector('.gv-grid-view').classList.add('open');
    document.querySelector('.gv-list-view').classList.remove('open');
    document.querySelector('.gv-list-view').classList.add('close');
    document.querySelector('.toggle-view-overlay-btn').classList.remove('grid-icon-show');

     var rect = getCoords(document.getElementById("gv-wrap-all"));

    var h = rect.top;

    if (lastScrollTop <= h) {
        lastScrollTop = h;
    }

    window.scrollTo(0, lastScrollTop);
    // window.setTimeout(function() {
    //     fixList(false);
    // }, 1000);

    waitForTransitionEnd( false );
}

function hideGrid() {
    lastScrollTop = document.documentElement.scrollTop || document.body.scrollTop; // Resets to last viewed area of grid
    fixGrid(true);
    fixList(false);
    document.querySelector('.gv-grid-view').classList.remove('open');
    document.querySelector('.gv-grid-view').classList.add('close');
    document.querySelector('.gv-list-view').classList.remove('close');
    document.querySelector('.gv-list-view').classList.add('open');
    document.querySelector('.toggle-view-overlay-btn').classList.add('grid-icon-show');
}

function fixGrid(fix) {

    //alert(fix);

    var viewportOffset, t, l, w, grid;

    if (fix == true) {
        // alert("called");
        grid = document.querySelector('#gv-grid-view');
        viewportOffset = grid.getBoundingClientRect();
        t = viewportOffset.top;
        l = viewportOffset.left;
        w = viewportOffset.width;
        grid.style.top = t + "px";
        grid.style.left = l + "px";
        grid.style.width = w + "px";
    } else {

        grid = document.getElementById('gv-grid-view');
        grid.style.top = "";
        grid.style.left = "";
        grid.style.width = "";


    }
}

function fixList(fix) {

    var viewportOffset, t, l, w, list = document.querySelector('.gv-list-view');

    if (fix) {
        viewportOffset = list.getBoundingClientRect();
        t = viewportOffset.top;
        l = viewportOffset.left;
        w = viewportOffset.width;
        list.style.top = t + "px";
        list.style.left = l + "px";
        list.style.width = w + "px";
        list.style.position = "fixed";
    } else {
        list.style.top = "";
        list.style.left = "";
        list.style.width = "";
        list.style.position = "";
    }
}

function waitForTransitionEnd( bool ) {
    var transitionEndEventName = getTransitionEndEventName(); //figure out, e.g. "webkitTransitionEnd".. 
    var elemToAnimate = document.querySelector('#gv-grid-view');//the thing you want to animate..
    var done = false;
    var transitionEnded = function(){
     done = true;
     //do your transition finished stuff..
     fixList( false );
     elemToAnimate.removeEventListener(transitionEndEventName,
                                        transitionEnded, false);
     //console.log("transitionEnd");
};
elemToAnimate.addEventListener(transitionEndEventName,
                                transitionEnded, false);

//animation triggering code here..

//ensure tidy up if event doesn't fire..
setTimeout(function(){
    if(!done){
        //console.log("timeout needed to call transition ended..");
        transitionEnded();
    }
}, 250); //note: XXX should be the time required for the
        //animation to complete plus a grace period (e.g. 10ms) 
}

function getTransitionEndEventName () {
    var i,
        undefined,
        el = document.createElement('div'),
        transitions = {
            'transition':'transitionend',
            'OTransition':'otransitionend',  // oTransitionEnd in very old Opera
            'MozTransition':'transitionend',
            'WebkitTransition':'webkitTransitionEnd'
        };

    for (i in transitions) {
        if (transitions.hasOwnProperty(i) && el.style[i] !== undefined) {
            return transitions[i];
        }
    }

    //TODO: throw 'TransitionEnd event is not supported in this browser';
    return ""; 
}

function jumpToIndex(ind) {
    document.querySelector('#list-entry_' + ind).scrollIntoView(true);
}

function getCoords(elem) { // crossbrowser version
    var box = elem.getBoundingClientRect();

    var body = document.body;
    var docEl = document.documentElement;

    var scrollTop = window.pageYOffset || docEl.scrollTop || body.scrollTop;
    var scrollLeft = window.pageXOffset || docEl.scrollLeft || body.scrollLeft;

    var clientTop = docEl.clientTop || body.clientTop || 0;
    var clientLeft = docEl.clientLeft || body.clientLeft || 0;

    var offsetHeight = elem.offsetHeight || 0;

    var top = box.top + scrollTop - clientTop;
    var left = box.left + scrollLeft - clientLeft;
    var bottom = top + offsetHeight;

    return { top: Math.round(top), left: Math.round(left), bottom: Math.round(bottom) };
}

function checkFixElements() {

    //if (!isMobile()) {

        //let h = document.getElementById("bannerandheader").offsetHeight || 0;

        var rect = getCoords(document.getElementById("gv-wrap-all"));

        var h = rect.top;
        var b = rect.bottom;




        //console.log("oh=" + h);

        var pos_top = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;

        //console.log("pos_top=" + pos_top);
        //console.log("oh=" + h);


        if ( pos_top > h && !isMobile() ) {
            //console.log("fixed");
            document.querySelector('#toggle-view-overlay-btn').classList.add('gv-fixed');
            document.querySelector('#toggle-view-overlay-btn').style.marginTop = -h + "px";
            //console.log("Add fix");
        } else if (pos_top < h) {
            document.querySelector('#toggle-view-overlay-btn').classList.remove('gv-fixed');
            document.querySelector('#toggle-view-overlay-btn').style.marginTop = "0";
            //console.log("Remove fix");
        }

         if ( pos_top < (h-300) && isMobile() ) {
            //console.log("fixed");
            document.querySelector('#toggle-view-overlay-btn').classList.add('gv-init-hide');
            //document.querySelector('#toggle-view-overlay-btn').style.marginTop = -h + "px";
        } else {
            document.querySelector('#toggle-view-overlay-btn').classList.remove('gv-init-hide');
            //document.querySelector('#toggle-view-overlay-btn').style.marginTop = "0";
        }

    if ( pos_top > b ) {
            //console.log("fixed");
            document.querySelector('#toggle-view-overlay-btn').classList.add('gv-hide');
            //document.querySelector('#toggle-view-overlay-btn').style.marginTop = -h + "px";
        } else {
            document.querySelector('#toggle-view-overlay-btn').classList.remove('gv-hide');
            //document.querySelector('#toggle-view-overlay-btn').style.marginTop = "0";
        }

}

function getPositionIdArray(positions) {

    var i, position, arr = [];

    positions = String(positions).split("/");

    for (i = 0; i < positions.length; i++) {

        position = String(positions[i]).toLowerCase().trim();

        switch (position) {

            case "goalkeeper":

                arr.push("GK");

                break;

            case "forward":

                arr.push("F1");

                break;

            case "attacking midfielder":

                arr.push("M2");

                break;

            case "midfielder":

                arr.push("M3");

                break;

            case "striker":

                arr.push("F2");

                break;

            case "defensive midfielder":

                arr.push("M3");

                break;

            case "defender":

                arr.push("D2");

                break;

            case "winger":

                arr.push("M1");

                break;

        }

    }

    return arr;

}

function drawPositions(data) {


    var i, ii, position, arr, el, id;


    for (i = 0; i < data.length; i++) {

        arr = getPositionIdArray(data[i].Position);


        for (ii = 0; ii < arr.length; ii++) {

            id = arr[ii];

            //console.log(id);
            //var selector = '#gv-pitch_' + i + '_marker_' + id;
            //console.log(selector);

            el = document.getElementById('gv-pitch_' + i + '_marker_' + id);
            //el = document.querySelector('#list-entry_' + i  );

            //console.log(el)

            el.style.visibility = "visible";

        }

    }

}

function getMovementText( oldRank, change, changeTxt ){
   
    var strOut = oldRank + " <span class='gv-details-dim'>2016</span> ";
 
        if ( changeTxt == "New entry" ){
          strOut = "<span class='gv-details-change'>New</span>";
        
        } else if ( changeTxt == "Re-entry" ){
          strOut = "<span class='gv-details-change'>Re-entry</span>";
        }
         else if( change == 0 ){
        strOut += "<span class='gv-details-change'></span>&nbsp;&#9654;"; // same
        } else if( change < 0 ){
          change = Math.abs(change);
           strOut += "<span class='gv-details-change'>&#9660;</span>"+ change +""; // Down
        }else if(change > 0){
          strOut += "<span class='gv-details-change'>&#9650;</span>"+ change +""; // Up
        } 
             
       //console.log(strOut);
    return strOut;
  }

