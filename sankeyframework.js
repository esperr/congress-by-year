    google.charts.load('current', {'packages':['sankey']});

    //Default values
    var billType = "HR";
    var congress = 113;
    var classification = "policyareas";

    //Parse our querystring to see if there is a different billype or congress
    if (location.search) {
      var queryDict = {};
      location.search.substr(1).split("&").forEach(function(item) {
          queryDict[item.split("=")[0]] = item.split("=")[1]
      })
      console.log(queryDict);
      if (queryDict["congress"]) { congress = queryDict["congress"]; }
      if (queryDict["billType"]) { billType = queryDict["billType"]; }
      if (queryDict["classification"]) { billType = queryDict["classification"]; }
    }

    $('#congress option[value=' + congress + ']').prop('selected', true);
    $('#type option[value=' + billType + ']').prop('selected', true);
    $('#classification option[value=' + classification + ']').prop('selected', true);

    var filenameStem = "https://esperr.github.io/congressviz/data/sankey";
    var allsubjects;

    //manually call a fetch when we load the page for the first time
    fetchTotals();

    function fetchTotals() {
      $( "#subjectlisting" ).empty();
      filename = filenameStem + classification + "_" + congress + "_" + billType + ".js";
      $.getJSON( filename, function( data ) {
        allsubjects = data;
        addSubjects();
      })
      .fail(function() {
        alert( "There was some sort of problem -- please reload the page" );
      })
    }

    function addSubjects() {
      var subjectList = [];
      for (var subject in allsubjects) {
        if (allsubjects.hasOwnProperty(subject)) {
          subjectList.push(subject);
        }
      }
      subjectList.sort();
      var auxArr = [];
      $.each(subjectList, function(i, subject)
        {
          auxArr[i] = "<option value='" + subject + "'>" + subject + "</option>";
        });
        $('#subjectlisting').append(auxArr.join(''));
        if (classification == "subjects") {
          $('#subjectlisting option[value="All_subjects"]').prop('selected', true);
        } else {
          $('#subjectlisting option[value="All_areas"]').prop('selected', true);
        }
        $( "#subjectlisting" ).change(function() {
          newsubject = $( "#subjectlisting option:selected" ).val();
          chartSubject(newsubject);
        });
        delayedCharting();
        function delayedCharting() {
          timeoutID = window.setTimeout(function() { $('#subjectlisting').change(); }, 500);
        }
      }

    function chartSubject(subject) {
      var mySubject = [];
      $.each( allsubjects[subject], function( key, value ) {
        var parts = key.split("|");
        newRow = [];
        newRow.push(parts[0]);
        newRow.push(parts[1]);
        newRow.push(value);
        if (value > 0) {
          mySubject.push(newRow);
        }
      });
      mydata = mySubject;
      drawChart();
    }

    function drawChart() {
      var data = new google.visualization.DataTable();
      data.addColumn('string', 'From');
      data.addColumn('string', 'To');
      data.addColumn('number', 'Bills');
      data.addRows(mydata);

      // Sets chart options.
      var options = {
        width: 1000,
      };

      // Instantiates and draws our chart, passing in some options.
      var chart = new google.visualization.Sankey(document.getElementById('sankey_basic'));
      chart.draw(data, options);
    }

    $( "#congress" ).change(function() {
      congress = $( "#congress option:selected" ).val();
      fetchTotals();
    });
    $( "#type" ).change(function() {
      billType = $( "#type option:selected" ).val();
      fetchTotals();
    });
    $( "#classification" ).change(function() {
      classification = $( "#classification option:selected" ).val();
      fetchTotals();
    });
