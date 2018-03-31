var searches = { counts:{}, searchterms:[] };
var dataURL = "";
var basecounts = {};

var d = new Date();
var thisYear = d.getFullYear();
var urlstem = "https://flicker-memory.glitch.me/";
var myQuerystring = "";

google.charts.load('current', {'packages':['line']});


var currentwidth = $("#left").innerWidth() * .9;
var mywidth = 600;
var myheight = 300;
if (currentwidth > mywidth) {
  mywidth = currentwidth;
  myheight = currentwidth*.5;
}
//var startYear = 1993;
//var endYear = thisYear;
var startYear;
var endYear;
var allyears = [];
var data;
var options;

var printsize = "small";
var currentLocation = location.hostname + location.pathname;
var type = "bills";

//Do we have a search or datespan specified in the querystring?
var queryDict = {};
location.search.substr(1).split("&").forEach(function(item) {
    queryDict[item.split("=")[0]] = item.split("=")[1]
})
if(queryDict["type"]) {
  type = queryDict["type"];
}

getbaseline();

  function getbaseline() {
    //Fetch our baseline counts from the webservice
    $.get( urlstem + "baseline?type=" + type, function( data ) {
      //build out our data structure
      var allCounts = data.navigators[1].buckets;
      console.log(allCounts);
      for (i=0; i<allCounts.length; i++) {
        allyears.push(allCounts[i].value);
        searches.counts[allCounts[i].value] = { "total": allCounts[i].count } ;
      }
      allyears.sort();
      console.log(allyears);
      startYear = allyears[0];
      endYear = allyears[allyears.length-1];
      //there's something hinky about the indexing for CRECB after 1998
      if (type == "CRECB") {
        endYear = 1998;
      }
      pickYears();
    })
    .fail(function() {
      alert( "There was some sort of problem -- please reload the page" );
    })
    .done(function() {
      if (location.search) {
        querySearch(queryDict);
      }
    });
  }

function querySearch(queryDict) {
  $('#type option[value="' + type + '"]').prop('selected', true);
  //getbaseline();
  if (queryDict["startyear"]) { startYear = queryDict["startyear"]; }
  if (queryDict["endyear"]) { endYear = queryDict["endyear"]; }
  for (var search in queryDict) {
    if(search.match(/q/)) {
      term = decodeURIComponent(queryDict[search])
      dosearch(term);
    }
  }
}

function handlesearch() {
  term = $("#pmsearch").val();
  dosearch(term);
  $("#pmsearch").val("");
  document.getElementById('pmsearch').focus();
  }


  window.onpopstate = function(event) {
    //reconstitute earlier searches if the user is going "back"
    if (event.state) {
      searches = event.state["myData"];
      startYear = event.state["startyear"];
      endYear = event.state["endyear"];
      drawMainChart();
    }
  };

function showWait() {
  $( "#pmsearch" ).prop( "disabled", true );
  $( "#runsearch" ).prop( "disabled", true );
  $( "form" ).addClass( "hideme" );
  $("#results").empty();
  $( "#results" ).append("<div id='loading'><p class='text-center'>Grabbing your results &mdash; please wait</p></div>")
  $( "#results p" ).append( '<br /><img src="loading-bars.svg">' );
  }

  function showDone() {
    $( "#pmsearch" ).prop( "disabled", false );
    $( "#runsearch" ).prop( "disabled", false );
    $( "form" ).removeClass( "hideme" );
    $( "#runsearch" ).removeClass( "hideme" );
    $("#loading").remove();
    $("#fetchresults").remove();
    }

  function pickYears() {
    console.log(endYear);
    $("#pickyears").empty();
    $("#pickyears").append('Start: <select name="startyear">');
    $("#pickyears").append('&nbsp;&nbsp;End: <select name="endyear">');
    for (var year in searches.counts) {
      if (Number(year) < 1600) { continue; }
      if (Number(year) < endYear) {
        if (year == startYear) {
          $("[name=startyear]").append('<option value="' + year + '" selected="selected">' + year + '</option>');
        } else {
          $("[name=startyear]").append('<option value="' + year + '">' + year + '</option>');
        }
      }
      if (Number(year) > startYear) {
        if (year == endYear) {
          $("[name=endyear]").append('<option value="' + year + '" selected="selected">' + year + '</option>');
        } else {
          $("[name=endyear]").append('<option value="' + year + '">' + year + '</option>');
        }
      }
    }
  }

$(".example").click(function(){
    var searchstr = $( this ).attr("data-srchstr");
     window.open(location.pathname + "?" + searchstr);
    });

$( "#results" ).on( "click", ".printMe", function() {
    getprint();
    });

$( "#results" ).on( "click", ".shareLink", function() {
    $('#sharing-link').modal();
    });

  $( "#pickyears" ).on( "change", "[name=startyear]", function() {
    startYear = Number($("[name=startyear]").val());
    pickYears();
    if (searches.searchterms.length > 0) {
        drawMainChart();
    }
  });

  $( "#pickyears" ).on( "change", "[name=endyear]", function() {
    endYear = Number($("[name=endyear]").val());
    pickYears();
    if (searches.searchterms.length > 0) {
      drawMainChart();
    }
  });

  $( "#results" ).on( "click", "#reset", function() {
    location.replace(location.pathname + "?type=" + type);
  });

  $( "#changesize" ).click(function() {
    if ( printsize == "small" ) {
      printsize = "large";
    } else {
      printsize = "small";
    }
    getprint();
  });

  $( "#type" ).change(function() {
    type = $( "#type option:selected" ).val();
    location.replace(location.pathname + "?type=" + type);
  });

function dosearch(term) {
  showWait();
  url = urlstem + "search?type=" + type + "&search=" + encodeURIComponent(term);
  $.get( url, function( data ) {
    if (data.iTotalCount > 0) {
      searches.searchterms.push(term);
      myCounts = data.navigators[1].buckets;
      for (i=0; i<myCounts.length; i++) {
        searches.counts[myCounts[i].value][term] = myCounts[i].count;
        //searches.counts[year][term] = myCounts[year];
      }
      drawMainChart();
    } else {
      showDone();
      //getTotals(term);
      $("#results").append('<div id="noJoy" class="alert alert-warning alert-danger" role="alert">');
      $("#results .alert").append('<button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button>');
      $("#results .alert").append('<h4>Sorry!&nbsp;</h4>');
      $("#results .alert").append("<p><div id=noJoymsg></div></p>");
      $("#noJoymsg").append('Nothing was found for this search. Try another search');
      //'alert("Nothing found for this search or too few results to chart by year. Please try again");
      $('#noJoy').on('closed.bs.alert', function () {
        if (searches.searchterms.length > 0) {
          console.log(JSON.stringify(searches))
            drawMainChart();
        } else {
          return;
        }
      })
    }
  })
  .fail(function() {
    alert( "There was some sort of problem -- please reload the page" );
  });
  }

$("#runsearch").click(function(){
    handlesearch();
  });

 $(document).keypress(function(e) {
  if(e.which == 13) {
      //Because both IE and FF now "helpfully" ignore the spec and treat 'button' the same as 'submit'
      e.preventDefault();
      handlesearch();
  }
});



function drawMainChart() {
  $("#results").empty();
  showDone();
  $("#results").append('<p>Search again above to compare results on your chart. Choose "Reset Searches" below to start over.</p>');
  $("#results").append('<p>Hover to see details for a given year. Click to launch a search in another window</p>');

  $( "#results" ).append( '<div class="panel panel-default">' );
  $( "#results .panel" ).append( '<div id="chart_div" class="panel-body">' );
  //"hidden" div where we draw the printable chart
  $( "#results" ).append( '<div id="chart_two">' );
  $("#results .panel").after('<button id="reset" type="button" class="btn btn-warning">Reset Searches</button>');

  makeQuerystring();

  data = new google.visualization.DataTable();
  data.addColumn('string', 'Year');
  for (i = 0; i < searches.searchterms.length; i++) {
    data.addColumn('number', searches.searchterms[i]);
  }


  for (var year in searches.counts) {
    if (Number(year) < startYear) { continue; }
    if (Number(year) > endYear) { continue; }
    theseCounts = [year];
    for (i = 0; i < searches.searchterms.length; i++) {
      var term = searches.searchterms[i];
      var yearTotal = Number(searches.counts[year]["total"]);
      if (searches.counts[year][term]) {
        var proportion = Number(searches.counts[year][term]) / yearTotal;
        construct = {
          v: proportion,
          f: Number(searches.counts[year][term]).toLocaleString() + " citations (out of " + yearTotal.toLocaleString() + " in " + year + ")"
        }
        theseCounts.push(construct);
        //theseCounts.push(proportion);
      } else {
        theseCounts.push(0);
      }
    }
    data.addRow(theseCounts);
  }
  //we clear the address bar...
  var ourLocation = location.pathname + "?" + myQuerystring;
  history.pushState({ "myData": searches, "startyear": startYear, "endyear": endYear }, "No real title here", ourLocation);


  options = {
        chart: {
          title: 'Proportion for results in ' + $( "#type option:selected" ).text(),
          subtitle: 'proportion for each search by year, ' + $("[name=startyear]").val() + ' to ' + $("[name=endyear]").val()
        },
        width: mywidth,
        height: myheight,
        vAxis: {format: 'decimal',
                title: 'proportion'},
      };

  var chart = new google.charts.Line(document.getElementById('chart_div'));

  //Here comes the clicky bit...
  function selectHandler() {
  var selectedItem = chart.getSelection()[0];
  if (selectedItem) {
    var year = data.getValue(selectedItem.row, 0);
    var thisSearchindex = selectedItem['column'];
    var myterm = searches.searchterms[thisSearchindex-1];
    var resultsURL = 'https://www.govinfo.gov/app/search/';
    var querybits = '{"offset":0,"query":"collection:(' + type + ') AND publishdate:' + year + ' AND content:(' + myterm + ')","historical":true}';
    resultsURL = resultsURL + querybits;
    window.open(resultsURL,'_blank');
   }
  }

  google.visualization.events.addListener(chart, 'select', selectHandler);
  chart.draw(data,  google.charts.Line.convertOptions(options));

  $("#chart_div").append('<a href="#!" class="printMe">Printable version</a>');
  $("#chart_div").append('<p>Share this search: <a href="#!" class="shareLink">Link</a></p>');

  }

  function getprint() {
    //$( "#printable img" ).remove();
    $("#chart_two").removeClass( "hideme" );
    if (printsize == "small") {
      width = 600;
      height = 300;
      $("canvas").attr("width", "600");
      $("canvas").attr("height", "330");
      $("#printchart").removeClass("modal-wide");
      $("#printchart").addClass("modal-medium");
      $("#changesize").text("Larger size");
    }
    if (printsize == "large") {
      width = 1200;
      height = 600;
      $("canvas").attr("width", "1200");
      $("canvas").attr("height", "630");
      $("#printchart").removeClass("modal-medium");
      $("#printchart").addClass("modal-wide");
      $("#changesize").text("Smaller size");
    }
    var charttwo = new google.charts.Line(document.getElementById('chart_two'));
    options.width = width;
    options.height = height;
    charttwo.draw(data,  google.charts.Line.convertOptions(options));
    google.visualization.events.addListener(charttwo, 'ready', myReadyHandler);

    function myReadyHandler() {
      var t = $("#chart_two svg")[0];
      var xmlString = (new XMLSerializer).serializeToString(t);
      var canvchart = document.createElement("canvas");
      canvg(canvchart, xmlString, { log: true, ignoreMouse: true, ignoreAnimation: true });
      var c2 = document.createElement("canvas");
      c2.width = width;
      c2.height = height + 40;
      var ctx = c2.getContext('2d');
      ctx.beginPath();
      ctx.rect(0, 0, width, height + 40);
      ctx.fillStyle = "white";
      ctx.fill();
      ctx.font="13px Roboto";
      ctx.fillStyle = "Gray";
      ctx.fillText("Made with Congress by Year: http://esperr.github.io/",0,height + 25);

      //var can = document.getElementById('canvas');
      var can3 = document.getElementById('canvas');
      var ctx3 = can3.getContext('2d');

      ctx3.drawImage(c2, 0, 0);
      ctx3.drawImage(canvchart, 0, 0);
      var newdataURL = c2.toDataURL();
      $("#chart_two").addClass( "hideme" );
      $('#printchart').modal();
      //$("#printable").css("display", "block");
    }
    //$('#printchart').on('hide.bs.modal', function () {
    //    alert("Closed!");
    //    $("#chart_two").addClass( "hideme" );
    //});
    }

//$(".close").click(function(){
//  $("#printable").css("display", "none");
//      });

//$(document).click(function(event) {
//   var closeit = document.getElementById('printable');
//   if (event.target == closeit) {
//      $("#printable").css("display", "none");
//      }
//      });

function makeQuerystring() {
  for (i=0; i<searches.searchterms.length; i++) {
    if (myQuerystring.length > 0) { myQuerystring = myQuerystring + "&"; }
    var qindex = i+1;
    var querypart = 'q' + qindex.toString() + '=' + searches.searchterms[i];
    myQuerystring = myQuerystring + querypart;
  }
  if (startYear != allyears[0]) {
    myQuerystring = myQuerystring + "&startyear=" + startYear;
  }
  if (endYear != thisYear) {
    myQuerystring = myQuerystring + "&endyear=" + endYear;
  }
  myQuerystring = myQuerystring + "&type=" + type;
  var shareUrl = currentLocation + "?" +  myQuerystring;
  $( "#sharingUrlcontent" ).attr( "style", "width: 35em;" );
  $( "#sharingUrlcontent" ).attr( "value", shareUrl );
}

//function keysrt(arr, key, reverse) {
//    var sortOrder = 1;
//    if(reverse){
//        sortOrder = -1;
//    }
//    return arr.sort(function(a, b) {
//        var x = a[key],
//            y = b[key];

//        return sortOrder * ((x < y) ? -1 : ((x > y) ? 1 : 0));
//    });
//}
